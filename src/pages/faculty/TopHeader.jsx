import React, { useEffect, useState } from "react";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { Link } from "react-router-dom";
import { clearAuthTokens } from "../../utils/Api";

const TopHeader = () => {
  const [isLightTheme, setIsLightTheme] = useState(() => {
    const savedTheme = localStorage.getItem("isLightTheme");
    return savedTheme !== null ? JSON.parse(savedTheme) : true;
  });

  const toggleTheme = () => {
    setIsLightTheme((prevTheme) => {
      const newTheme = !prevTheme;
      localStorage.setItem("isLightTheme", JSON.stringify(newTheme));
      return newTheme;
    });
  };

  useEffect(() => {
    if (isLightTheme) {
      document.body.classList.remove("dark-mode");
    } else {
      document.body.classList.add("dark-mode");
    }
  }, [isLightTheme]);

  const logout = () => {
    clearAuthTokens();
    window.location.href = "/";
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-20 w-full py-3 px-4 fixed lg:static">
      <div className="flex justify-between items-center">
        {/* Left side - Brand logo for mobile */}
        <div className="flex lg:hidden items-center">
          <Link to="/faculty/dashboard" className="flex items-center">
            <img
              src="/agnel-logo2.png"
              alt="Faculty Portal"
              className="h-8 ml-10"
            />
          </Link>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center ml-auto">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isLightTheme ? (
              <Brightness4Icon className="h-5 w-5" />
            ) : (
              <Brightness7Icon className="h-5 w-5" />
            )}
          </button>

          {/* Logout button */}
          <button
            onClick={logout}
            className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
