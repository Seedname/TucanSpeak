import React, { useContext, useState } from "react";
import { assets } from "../../../assets/assets.js";
import {
  LanguageIcon,
  SpeakerWaveIcon,
  PencilIcon,
  ChevronDoubleUpIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContext } from "../../../context/AppContext.jsx";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {url} = useContext(AppContext)

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const logOut = async () => {
    await axios.post("/auth/logout");
    navigate('/');
  }

  const navigate = useNavigate();

  return (
    <div className="bg-white border-r-2 w-1/5">
      <img src={assets.tucan_speak_logo} alt="" />
      <ul className="items-center mt-[5%] text-left text-lg flex flex-col gap-2 font-semibold">
        <li
          onClick={toggleDropdown}
          className="flex items-center w-[85%] px-4 py-[10px] border-2 rounded-lg hover:bg-green-100 cursor-pointer relative"
        >
          Games
          <ArrowUpIcon
            className={`ml-auto h-5 w-5 transform transition-transform duration-300 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </li>

        <ul
          className={`flex flex-col gap-2 mt-[5%] absolute left-0 w-1/5 z-10 items-center transition-all duration-300 ease-in-out ${
            isDropdownOpen
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-5 scale-95"
          } origin-top`}
        >
          <li
            onClick={() => navigate("/flight")}
            className={`flex items-center w-[85%] px-4 py-[10px] border-2 rounded-lg bg-white hover:bg-green-100 ${
              isDropdownOpen ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <ChevronDoubleUpIcon className="h-5 w-5 mr-2" />
            TuCan Fly
          </li>
          <li
            onClick={() => navigate("/draw")}
            className={`flex items-center w-[85%] px-4 py-[10px] border-2 rounded-lg bg-white hover:bg-green-100 ${
              isDropdownOpen ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            TuCan Draw
          </li>
          <li
            onClick={() => navigate("/talk")}
            className={`flex items-center w-[85%] px-4 py-[10px] border-2 rounded-lg bg-white hover:bg-green-100 ${
              isDropdownOpen ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <SpeakerWaveIcon className="h-5 w-5 mr-2" />
            TuCan Talk
          </li>
          <li
            onClick={() => navigate("/translate")}
            className={`flex items-center w-[85%] px-4 py-[10px] border-2 rounded-lg bg-white hover:bg-green-100 ${
              isDropdownOpen ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <LanguageIcon className="h-5 w-5 mr-2" />
            TuCan Translate
          </li>
        </ul>
        <li className="mb-[130%]"></li>
        <li className="w-[85%] px-4 py-[10px] border-2 rounded-lg hover:bg-green-100 cursor-pointer">
          Cambiar Idioma
        </li>
        <li className="w-[85%] px-4 py-[10px] border-2 rounded-lg hover:bg-green-100 cursor-pointer" onClick={logOut}>
          Log Out
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
