import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  createBrowserRouter,
  RouterProvider,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";

const IconChevron = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

function SelectField({
  id,
  name,
  value,
  onChange,
  disabled,
  icon,
  placeholder,
  options,
}) {
  return (
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none leading-none"
        aria-hidden="true"
      >
        {icon}
      </span>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full h-11 pl-9 pr-9 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm font-medium cursor-pointer transition-all duration-150"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={String(opt.id)}>
            {opt.name}
          </option>
        ))}
      </select>
      <span
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        aria-hidden="true"
      >
        <IconChevron />
      </span>
    </div>
  );
}

// Detect GitHub Pages project subpath and set as basename
const detectedBase = (() => {
  const path = window.location.pathname || "";
  // Adjust this if repository name changes
  return path.startsWith("/kledo-assessment") ? "/kledo-assessment" : "/";
})();

// Loader to fetch regions data via React Router Data APIs
async function regionsLoader() {
  // Build absolute URL anchored to the detected base to avoid dropping the repo segment
  const base = detectedBase.endsWith("/") ? detectedBase.slice(0, -1) : detectedBase;
  const assetUrl = `${base}/assets/data/indonesia_regions.json`;
  const res = await fetch(assetUrl, { cache: "no-cache" });
  if (!res.ok) {
    throw new Response("Gagal memuat data wilayah", { status: res.status });
  }
  return res.json();
}

function FilterPage() {
  const data = useLoaderData();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  const provinces = data?.provinces ?? [];
  const regencies = data?.regencies ?? [];
  const districts = data?.districts ?? [];

  const province = searchParams.get("province") || "";
  const regency = searchParams.get("regency") || "";
  const district = searchParams.get("district") || "";

  const regenciesByProvince = React.useMemo(() => {
    const map = new Map();
    for (const r of regencies) {
      const k = String(r.province_id);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    return map;
  }, [regencies]);

  const districtsByRegency = React.useMemo(() => {
    const map = new Map();
    for (const d of districts) {
      const k = String(d.regency_id);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(d);
    }
    return map;
  }, [districts]);

  const filteredRegencies = province
    ? regenciesByProvince.get(province) || []
    : [];
  const filteredDistricts = regency
    ? districtsByRegency.get(regency) || []
    : [];

  const selectedProvince =
    provinces.find((p) => String(p.id) === province) || null;
  const selectedRegency =
    filteredRegencies.find((r) => String(r.id) === regency) || null;
  const selectedDistrict =
    filteredDistricts.find((d) => String(d.id) === district) || null;

  const handleProvince = (e) => {
    const v = e.target.value;
    const params = new URLSearchParams();
    if (v) params.set("province", v);
    setSearchParams(params, { replace: true });
  };
  const handleRegency = (e) => {
    const v = e.target.value;
    const params = new URLSearchParams();
    const p = province;
    if (p) params.set("province", p);
    if (v) params.set("regency", v);
    setSearchParams(params, { replace: true });
  };
  const handleDistrict = (e) => {
    const v = e.target.value;
    const params = new URLSearchParams();
    if (province) params.set("province", province);
    if (regency) params.set("regency", regency);
    if (v) params.set("district", v);
    setSearchParams(params, { replace: true });
  };
  const handleReset = () => setSearchParams({}, { replace: true });

  const crumbs = [{ label: "Indonesia", key: "root" }];
  if (selectedProvince)
    crumbs.push({ label: selectedProvince.name, key: "prov" });
  if (selectedRegency) crumbs.push({ label: selectedRegency.name, key: "reg" });
  if (selectedDistrict)
    crumbs.push({ label: selectedDistrict.name, key: "dist" });

  const isLoading = navigation.state !== "idle";

  const renderContent = () => {
    if (!selectedProvince) {
      return (
        <div className="text-center text-slate-400">
          <div className="text-5xl mb-4 opacity-30" aria-hidden="true">
            🗺️
          </div>
          <p className="text-base font-medium">Pilih wilayah untuk memulai</p>
          <p className="text-sm mt-1.5 opacity-70">
            Gunakan filter di sebelah kiri
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-2.5">
            Provinsi
          </p>
          <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-none">
            {selectedProvince.name}
          </h1>
        </div>

        {selectedRegency && (
          <div className="text-center mt-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-2.5">
              Kota / Kabupaten
            </p>
            <h2 className="text-6xl font-black text-slate-900 tracking-tight leading-none">
              {selectedRegency.name}
            </h2>
          </div>
        )}

        {selectedDistrict && (
          <div className="text-center mt-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-2.5">
              Kecamatan
            </p>
            <h2 className="text-6xl font-black text-slate-900 tracking-tight leading-none">
              {selectedDistrict.name}
            </h2>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="bg-white border-b border-stone-200 h-14 flex items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center w-80 pl-6">
          <span className="text-base font-semibold tracking-tight">
            Frontend Assessment
          </span>
        </div>

        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb flex items-center gap-2 list-none text-sm font-medium text-slate-500">
            {crumbs.map((c, i) => (
              <React.Fragment key={c.key}>
                {i > 0 && (
                  <li>
                    <span className="text-slate-400" aria-hidden="true">
                      ›
                    </span>
                  </li>
                )}
                <li>
                  {i < crumbs.length - 1 ? (
                    <span className="no-underline">{c.label}</span>
                  ) : (
                    <span
                      className="text-indigo-600 font-semibold"
                      aria-current="page"
                    >
                      {c.label}
                    </span>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>
      </div>

      <div className="flex flex-1 h-[calc(100vh-56px)]">
        <aside className="w-80 bg-white border-r border-stone-200 px-6 py-8 flex flex-col">
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-6">
            Filter Wilayah
          </p>

          <div className="mb-5">
            <label
              htmlFor="select-province"
              className="block text-xs font-semibold tracking-widest uppercase text-slate-600 mb-2"
            >
              Provinsi
            </label>
            <SelectField
              id="select-province"
              name="province"
              value={province}
              onChange={handleProvince}
              icon={<span aria-hidden="true">🗺️</span>}
              placeholder="Pilih Provinsi"
              options={provinces}
            />
          </div>

          <div className="mb-5">
            <label
              htmlFor="select-regency"
              className="block text-xs font-semibold tracking-widest uppercase text-slate-600 mb-2"
            >
              Kota/Kabupaten
            </label>
            <SelectField
              id="select-regency"
              name="regency"
              value={regency}
              onChange={handleRegency}
              disabled={!province}
              icon={<span aria-hidden="true">🏙️</span>}
              placeholder="Pilih Kota/Kabupaten"
              options={filteredRegencies}
            />
          </div>

          <div className="mb-5">
            <label
              htmlFor="select-district"
              className="block text-xs font-semibold tracking-widest uppercase text-slate-600 mb-2"
            >
              Kecamatan
            </label>
            <SelectField
              id="select-district"
              name="district"
              value={district}
              onChange={handleDistrict}
              disabled={!regency}
              icon={<span aria-hidden="true">📍</span>}
              placeholder="Pilih Kecamatan"
              options={filteredDistricts}
            />
          </div>

          <button
            onClick={handleReset}
            className="mt-3 w-full h-11 border border-indigo-600 rounded-lg bg-transparent text-indigo-600 text-sm font-semibold tracking-wide uppercase cursor-pointer flex items-center justify-center gap-2 transition-colors duration-150 hover:bg-indigo-50"
          >
            <span aria-hidden="true">↺</span> Reset
          </button>
        </aside>

        <div className="flex-1 flex flex-col">
          <main className="flex-1 flex flex-col items-center justify-center px-10 py-12">
            {isLoading ? (
              <div className="text-center text-slate-400">
                <div className="text-5xl mb-4 opacity-30" aria-hidden="true">
                  ⏳
                </div>
                <p className="text-base font-medium">Memuat data…</p>
              </div>
            ) : (
              renderContent()
            )}
          </main>
        </div>
      </div>
    </>
  );
}

function ErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center text-red-600">
        <p className="text-base font-semibold">Gagal memuat data wilayah</p>
      </div>
    </div>
  );
}

// detectedBase is defined above

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <FilterPage />,
      loader: regionsLoader,
      errorElement: <ErrorPage />,
    },
  ],
  { basename: detectedBase },
);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />,
);
