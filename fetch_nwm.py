import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import requests
import xarray as xr
from affine import Affine
from PIL import Image
from pyproj import CRS as PyprojCRS
from rasterio.crs import CRS as RasterioCRS
from rasterio.transform import array_bounds, from_origin
from rasterio.warp import (
    Resampling,
    calculate_default_transform,
    reproject,
    transform_bounds,
)
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


NWM_FILE = Path("nwm_temp.nc")
OUTPUT_PNG = Path("static/nwm_soil_saturation.png")
OUTPUT_JSON = Path("static/nwm_metadata.json")

LOOKBACK_HOURS = 12
MAX_OUTPUT_DIMENSION = 3000

HEADERS = {
    "User-Agent": (
        "WPC-Hydro-Dashboard/1.0 "
        "(GitHub Actions; NOAA NWM retrieval)"
    ),
    "Accept": "application/x-netcdf,application/octet-stream,*/*",
}


def build_session():
    retry = Retry(
        total=4,
        connect=4,
        read=4,
        backoff_factor=2.0,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
        raise_on_status=False,
    )
    session = requests.Session()
    session.headers.update(HEADERS)
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def is_netcdf_or_hdf5(path):
    try:
        with path.open("rb") as file:
            magic = file.read(8)

        return (
            magic.startswith(b"CDF\x01")
            or magic.startswith(b"CDF\x02")
            or magic == b"\x89HDF\r\n\x1a\n"
        )
    except OSError:
        return False


def download_latest_nwm():
    session = build_session()
    search_start = datetime.now(timezone.utc) - timedelta(hours=1)

    for hour_lag in range(LOOKBACK_HOURS + 1):
        target_time = (
            search_start - timedelta(hours=hour_lag)
        ).replace(
            minute=0,
            second=0,
            microsecond=0,
        )

        date_string = target_time.strftime("%Y%m%d")
        hour_string = target_time.strftime("%H")

        url = (
            "https://nomads.ncep.noaa.gov/pub/data/"
            "nccf/com/nwm/prod/"
            f"nwm.{date_string}/analysis_assim/"
            f"nwm.t{hour_string}z.analysis_assim."
            "land.tm00.conus.nc"
        )

        print(
            f"Checking NOAA NWM for "
            f"{date_string} {hour_string}Z..."
        )

        try:
            with session.get(
                url,
                stream=True,
                timeout=(20, 300),
            ) as response:
                if response.status_code == 404:
                    print(" -> Product not posted.")
                    continue

                if response.status_code != 200:
                    print(
                        f" -> HTTP {response.status_code}; "
                        "trying an older analysis."
                    )
                    continue

                with NWM_FILE.open("wb") as file:
                    for chunk in response.iter_content(
                        chunk_size=1024 * 1024
                    ):
                        if chunk:
                            file.write(chunk)

            if not is_netcdf_or_hdf5(NWM_FILE):
                print(
                    " -> Download was not a valid NetCDF/HDF5 file; "
                    "trying an older analysis."
                )
                NWM_FILE.unlink(missing_ok=True)
                continue

            print(
                "Success: downloaded NWM analysis "
                f"{date_string} {hour_string}Z"
            )
            return target_time, url

        except requests.RequestException as error:
            print(f" -> Connection error: {error}")

    raise RuntimeError(
        "No recent NWM analysis-assimilation land file "
        f"was found in the last {LOOKBACK_HOURS + 1} hours."
    )


def plain_python(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    return value


def projection_attrs_from_dataset(dataset, data_array):
    candidates = []

    grid_mapping_name = data_array.attrs.get("grid_mapping")
    if grid_mapping_name:
        candidates.append(str(grid_mapping_name))

    candidates.extend(
        [
            "ProjectionCoordinateSystem",
            "crs",
            "spatial_ref",
            "Lambert_Conformal",
        ]
    )

    for name, variable in dataset.variables.items():
        if "grid_mapping_name" in variable.attrs:
            candidates.append(name)

    seen = set()

    for name in candidates:
        if name in seen or name not in dataset.variables:
            continue

        seen.add(name)

        attrs = {
            key: plain_python(value)
            for key, value in dataset[name].attrs.items()
        }

        if attrs:
            print(f"Using NWM projection metadata variable: {name}")
            return attrs

    return {}


def determine_source_crs(dataset, data_array):
    attrs = projection_attrs_from_dataset(
        dataset,
        data_array,
    )

    if attrs:
        for key in (
            "crs_wkt",
            "spatial_ref",
            "esri_pe_string",
        ):
            wkt = attrs.get(key)
            if isinstance(wkt, str) and wkt.strip():
                try:
                    crs = PyprojCRS.from_wkt(wkt)
                    return RasterioCRS.from_wkt(crs.to_wkt())
                except Exception:
                    pass

        try:
            crs = PyprojCRS.from_cf(attrs)
            return RasterioCRS.from_wkt(crs.to_wkt())
        except Exception as error:
            print(
                "Could not build CRS from the file's CF metadata: "
                f"{error}"
            )

    print(
        "WARNING: Falling back to the standard NWM CONUS "
        "Lambert conformal definition."
    )

    fallback = PyprojCRS.from_proj4(
        "+proj=lcc "
        "+lat_1=30 +lat_2=60 "
        "+lat_0=40 +lon_0=-97 "
        "+R=6370000 "
        "+units=m +no_defs"
    )

    return RasterioCRS.from_wkt(fallback.to_wkt())


def validate_source_time(dataset, expected):
    """Require decoded time and global valid time to match the requested file."""
    if "time" not in dataset or dataset.time.size != 1:
        raise RuntimeError("NWM requires exactly one internal valid time")
    actual = np.asarray(dataset.time.values).reshape(-1)[0]
    expected64 = np.datetime64(expected.replace(tzinfo=None), "s")
    if not np.issubdtype(np.asarray(actual).dtype, np.datetime64) or actual != expected64:
        raise RuntimeError("NWM internal valid time differs from requested cycle")
    def parse_attr(name):
        value = dataset.attrs.get(name)
        if not value:
            raise RuntimeError(f"Missing NWM {name}")
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
    if parse_attr("model_output_valid_time") != expected:
        raise RuntimeError("NWM global valid time differs from requested cycle")
    initialization = parse_attr("model_initialization_time")
    if initialization > expected:
        raise RuntimeError("NWM initialization follows valid time")
    return initialization.isoformat().replace("+00:00", "Z")


def saturation_percent(data_array):
    """Decode using declared units; never infer units from a regional maximum."""
    if str(data_array.attrs.get("units", "")).strip() != "1":
        raise RuntimeError("SOILSAT_TOP must declare dimensionless units '1'")
    scale = data_array.encoding.get("scale_factor")
    offset = data_array.encoding.get("add_offset")
    if scale is None or not np.isclose(scale, 0.001, rtol=1e-6) or offset != 0:
        raise RuntimeError("Unexpected SOILSAT_TOP packing contract")
    values = np.asarray(data_array.values, dtype=np.float64)
    finite = values[np.isfinite(values)]
    if not finite.size or finite.min() < -1e-6 or finite.max() > 1 + 1e-6:
        raise RuntimeError("SOILSAT_TOP decoded values outside fractional saturation range")
    # Packed 1000 * float32 scale can exceed 1 by 4.75e-8.
    return (np.clip(values, 0, 1) * 100).astype(np.float32)


def prepare_source_grid(dataset):
    if "SOILSAT_TOP" not in dataset.data_vars:
        raise RuntimeError(
            "SOILSAT_TOP was not found in the NWM land file."
        )

    if "x" not in dataset.coords or "y" not in dataset.coords:
        raise RuntimeError(
            "NWM file does not contain the expected x and y coordinates."
        )

    data_array = dataset["SOILSAT_TOP"].squeeze(drop=True)

    if "x" not in data_array.dims or "y" not in data_array.dims:
        raise RuntimeError(
            f"Unexpected SOILSAT_TOP dimensions: {data_array.dims}"
        )

    data_array = data_array.transpose("y", "x")

    soil_saturation = saturation_percent(data_array)

    x = np.asarray(
        dataset["x"].values,
        dtype=np.float64,
    )
    y = np.asarray(
        dataset["y"].values,
        dtype=np.float64,
    )

    x_units = str(
        dataset["x"].attrs.get("units", "")
    ).strip().lower()
    y_units = str(
        dataset["y"].attrs.get("units", "")
    ).strip().lower()

    kilometer_units = {
        "km",
        "kilometer",
        "kilometers",
        "kilometre",
        "kilometres",
    }

    if x_units in kilometer_units:
        x *= 1000.0

    if y_units in kilometer_units:
        y *= 1000.0

    if x.ndim != 1 or y.ndim != 1:
        raise RuntimeError(
            "Expected one-dimensional NWM x and y coordinates."
        )

    if soil_saturation.shape != (y.size, x.size):
        raise RuntimeError(
            "SOILSAT_TOP shape does not match the x/y coordinate sizes: "
            f"{soil_saturation.shape} versus {(y.size, x.size)}."
        )

    if x[0] > x[-1]:
        x = x[::-1]
        soil_saturation = soil_saturation[:, ::-1]

    if y[0] < y[-1]:
        y = y[::-1]
        soil_saturation = soil_saturation[::-1, :]

    if not np.all(np.isfinite(x)) or not np.all(np.isfinite(y)):
        raise RuntimeError(
            "NWM x or y coordinates contain non-finite values."
        )

    x_differences = np.diff(x)
    y_differences = np.diff(y)

    if not np.all(x_differences > 0.0):
        raise RuntimeError(
            "NWM x coordinates are not strictly increasing."
        )

    if not np.all(y_differences < 0.0):
        raise RuntimeError(
            "NWM y coordinates are not strictly decreasing "
            "after north-up normalization."
        )

    # Use the complete coordinate span rather than requiring every
    # floating-point increment to be bit-for-bit identical. The NWM grid is
    # regular, but packed/decoded coordinate values can contain harmless
    # sub-metre rounding differences.
    dx = float((x[-1] - x[0]) / (x.size - 1))
    dy = float((y[0] - y[-1]) / (y.size - 1))

    if dx <= 0.0 or dy <= 0.0:
        raise RuntimeError(
            f"Invalid NWM grid spacing: dx={dx}, dy={dy}"
        )

    x_min_step = float(np.min(x_differences))
    x_max_step = float(np.max(x_differences))
    y_step_magnitudes = np.abs(y_differences)
    y_min_step = float(np.min(y_step_magnitudes))
    y_max_step = float(np.max(y_step_magnitudes))

    print(
        "NWM decoded x-step range: "
        f"{x_min_step:.6f} to {x_max_step:.6f}"
    )
    print(
        "NWM decoded y-step range: "
        f"{y_min_step:.6f} to {y_max_step:.6f}"
    )
    print(
        "NWM endpoint-derived grid spacing: "
        f"dx={dx:.6f}, dy={dy:.6f}"
    )

    source_transform = from_origin(
        west=float(x[0] - dx / 2.0),
        north=float(y[0] + dy / 2.0),
        xsize=dx,
        ysize=dy,
    )

    source_crs = determine_source_crs(
        dataset,
        data_array,
    )

    print(f"NWM source shape: {soil_saturation.shape}")
    print(f"NWM source CRS: {source_crs}")
    print(f"NWM source grid spacing: dx={dx}, dy={dy}")

    valid_values = soil_saturation[
        np.isfinite(soil_saturation)
    ]

    print(
        "NWM valid saturation range: "
        f"{float(np.nanmin(valid_values)):.1f}% to "
        f"{float(np.nanmax(valid_values)):.1f}%"
    )

    return soil_saturation, source_transform, source_crs


def reproject_to_web_mercator(
    source_data,
    source_transform,
    source_crs,
):
    source_height, source_width = source_data.shape

    source_bounds = array_bounds(
        source_height,
        source_width,
        source_transform,
    )

    destination_crs = RasterioCRS.from_epsg(3857)

    (
        destination_transform,
        destination_width,
        destination_height,
    ) = calculate_default_transform(
        source_crs,
        destination_crs,
        source_width,
        source_height,
        *source_bounds,
    )

    scale_factor = max(
        destination_width / MAX_OUTPUT_DIMENSION,
        destination_height / MAX_OUTPUT_DIMENSION,
        1.0,
    )

    if scale_factor > 1.0:
        reduced_width = max(
            1,
            int(round(destination_width / scale_factor)),
        )
        reduced_height = max(
            1,
            int(round(destination_height / scale_factor)),
        )

        destination_transform = (
            destination_transform
            * Affine.scale(
                destination_width / reduced_width,
                destination_height / reduced_height,
            )
        )

        destination_width = reduced_width
        destination_height = reduced_height

    destination = np.full(
        (destination_height, destination_width),
        np.nan,
        dtype=np.float32,
    )

    source_valid = np.isfinite(source_data).astype(np.uint8)
    destination_valid = np.zeros(
        (destination_height, destination_width),
        dtype=np.uint8,
    )

    reproject(
        source=source_data,
        destination=destination,
        src_transform=source_transform,
        src_crs=source_crs,
        src_nodata=np.nan,
        dst_transform=destination_transform,
        dst_crs=destination_crs,
        dst_nodata=np.nan,
        resampling=Resampling.bilinear,
        init_dest_nodata=True,
        num_threads=2,
    )

    reproject(
        source=source_valid,
        destination=destination_valid,
        src_transform=source_transform,
        src_crs=source_crs,
        src_nodata=0,
        dst_transform=destination_transform,
        dst_crs=destination_crs,
        dst_nodata=0,
        resampling=Resampling.nearest,
        init_dest_nodata=True,
        num_threads=2,
    )

    destination[destination_valid == 0] = np.nan
    destination[
        (destination < 0.0)
        | (destination > 100.0)
    ] = np.nan

    projected_bounds = array_bounds(
        destination_height,
        destination_width,
        destination_transform,
    )

    west, south, east, north = transform_bounds(
        destination_crs,
        RasterioCRS.from_epsg(4326),
        *projected_bounds,
        densify_pts=21,
    )

    leaflet_bounds = [
        [float(south), float(west)],
        [float(north), float(east)],
    ]

    print(
        "NWM EPSG:3857 output shape: "
        f"{destination.shape}"
    )
    print("NWM image CRS: EPSG:3857")
    print(f"NWM Leaflet bounds: {leaflet_bounds}")

    return destination, leaflet_bounds


def create_rgba_image(data):
    palette = np.array(
        [
            [210, 180, 140, 255],
            [224, 238, 224, 255],
            [144, 238, 144, 255],
            [60, 179, 113, 255],
            [0, 206, 209, 255],
            [30, 144, 255, 255],
            [0, 0, 139, 255],
        ],
        dtype=np.uint8,
    )

    rgba = np.zeros(
        (data.shape[0], data.shape[1], 4),
        dtype=np.uint8,
    )

    valid = np.isfinite(data)

    class_index = np.digitize(
        data,
        bins=[40, 60, 70, 80, 90, 95],
        right=False,
    )

    rgba[valid] = palette[class_index[valid]]
    return rgba


def main():
    OUTPUT_PNG.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    try:
        valid_time, source_url = download_latest_nwm()
        if OUTPUT_JSON.exists():
            previous = json.loads(OUTPUT_JSON.read_text())
            previous_time = previous.get("valid_time_iso")
            if previous_time and valid_time < datetime.fromisoformat(previous_time.replace("Z", "+00:00")):
                raise RuntimeError("Refusing to replace NWM with an older source valid time")

        print("Opening and processing NWM NetCDF file...")

        with xr.open_dataset(
            NWM_FILE,
            engine="h5netcdf",
            decode_coords="all",
            mask_and_scale=True,
        ) as dataset:
            initialization_time = validate_source_time(dataset, valid_time)
            (
                source_data,
                source_transform,
                source_crs,
            ) = prepare_source_grid(dataset)

        (
            destination_data,
            leaflet_bounds,
        ) = reproject_to_web_mercator(
            source_data,
            source_transform,
            source_crs,
        )

        rgba = create_rgba_image(destination_data)

        staged_png = OUTPUT_PNG.with_suffix(".pending.png")
        Image.fromarray(rgba).save(
            staged_png,
            optimize=True,
        )

        retrieval_time = datetime.now(timezone.utc)

        metadata = {
            "valid_time": valid_time.strftime(
                "NWM Saturation: %b %d, %Y %HZ"
            ),
            "valid_time_iso": valid_time.strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
            "retrieved_time": retrieval_time.strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
            "data_age_hours": round(
                (
                    retrieval_time - valid_time
                ).total_seconds() / 3600.0,
                1,
            ),
            "model_initialization_time": initialization_time,
            "last_attempt_time": retrieval_time.isoformat(),
            "update_status": "success",
            "freshness_policy": {"warn_hours": 3, "hide_hours": 6},
            "bounds": leaflet_bounds,
            "crs": "EPSG:3857",
            "image_crs": "EPSG:3857",
            "bounds_crs": "EPSG:4326",
            "product": "NOAA National Water Model SOILSAT_TOP",
            "depth": "top two soil layers, 0-40 cm",
            "units": "percent saturation",
            "source_url": source_url,
        }

        staged_json = OUTPUT_JSON.with_suffix(".pending.json")
        with staged_json.open(
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                metadata,
                file,
                indent=2,
            )

        staged_png.replace(OUTPUT_PNG)
        staged_json.replace(OUTPUT_JSON)

        print(f"Wrote {OUTPUT_PNG}")
        print(f"Wrote {OUTPUT_JSON}")
        print(
            "NWM soil saturation successfully "
            "reprojected and exported."
        )
        return 0

    except Exception as error:
        print(f"WARNING: NWM update failed: {error}")

        compatible_previous_output = False

        if OUTPUT_PNG.exists() and OUTPUT_JSON.exists():
            try:
                previous_metadata = json.loads(
                    OUTPUT_JSON.read_text(encoding="utf-8")
                )
                compatible_previous_output = (
                    str(
                        previous_metadata.get(
                            "image_crs",
                            previous_metadata.get("crs", ""),
                        )
                    ).upper()
                    == "EPSG:3857"
                )
            except Exception:
                compatible_previous_output = False

        if compatible_previous_output:
            print(
                "Keeping the previous EPSG:3857-compatible "
                "NWM dashboard layer."
            )
            previous_metadata["last_attempt_time"] = datetime.now(timezone.utc).isoformat()
            previous_metadata["update_status"] = "failed_retained"
            previous_metadata["freshness_policy"] = {"warn_hours": 3, "hide_hours": 6}
            OUTPUT_JSON.write_text(json.dumps(previous_metadata, indent=2) + "\n")
            return 1

        print(
            "No compatible previous NWM output exists; "
            "the workflow must fail instead of publishing stale metadata."
        )
        return 1

    finally:
        NWM_FILE.unlink(missing_ok=True)


if __name__ == "__main__":
    sys.exit(main())
