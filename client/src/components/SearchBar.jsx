import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

function SearchBar() {

  return (

    <div className="relative">

      <HiOutlineMagnifyingGlass
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl"
      />

      <input
        type="text"
        placeholder="Search destination..."
        className="
        w-full
        rounded-2xl
        bg-white
        py-4
        pl-12
        pr-4
        shadow
        outline-none
        focus:ring-2
        focus:ring-rose-500
        "
      />

    </div>

  );

}

export default SearchBar;