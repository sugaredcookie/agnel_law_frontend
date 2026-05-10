import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { examinerLoginAPI, clearAuthTokens } from "../../utils/Api";
import { toast } from "react-toastify";

const ExaminerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await examinerLoginAPI({ email, password });

      clearAuthTokens();

      localStorage.setItem("examinerToken", response.token);
      toast.success("Login successful");
      navigate("/examiner/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Server error");
    }
  };

  return (
    <>
      <Header />
      <div>
        <div className="container-scroller">
          <div className="container-fluid page-body-wrapper full-page-wrapper">
            <div className="row w-100 m-0">
              <div
                className="content-wrapper full-page-wrapper flex flex-col md:flex-row align-items-center auth login-bg"
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "1rem",
                }}
              >
                {/* Dark overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    zIndex: 1,
                  }}
                ></div>

                {/* Left side content */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    color: "white",
                    width: "100%",
                    marginRight: "0",
                    marginBottom: "2rem",
                  }}
                  className="md:w-3/5 lg:w-2/3 md:mr-8 md:mb-0"
                >
                  <h1 className="text-2xl md:text-3xl lg:text-4xl">
                    EXAMINER <br />
                    <span className="text-blue-500">LOGIN PORTAL</span>
                  </h1>
                  <p className="text-sm md:text-base">
                    Welcome to the Examiner Dashboard
                  </p>

                  {/* Information Box */}
                  <div
                    style={{
                      backgroundColor: "rgba(30, 58, 138, 0.6)",
                      backdropFilter: "blur(10px)",
                      padding: "1rem",
                      borderRadius: "8px",
                      marginTop: "1.5rem",
                      width: "100%",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                    className="md:p-6"
                  >
                    <h3
                      style={{
                        borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                        paddingBottom: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      className="text-lg md:text-xl"
                    >
                      Examiner Resources
                    </h3>
                    <ul
                      style={{ listStyle: "none", padding: 0 }}
                      className="text-sm md:text-base"
                    >
                      <li style={{ marginBottom: "0.8rem" }}>
                        • Review and verify submitted marks
                      </li>
                      <li style={{ marginBottom: "0.8rem" }}>
                        • Access exam reports and analytics
                      </li>
                      <li style={{ marginBottom: "0.8rem" }}>
                        • Manage examiner profile and settings
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Login form */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                  }}
                  className="md:w-2/5 lg:w-1/3"
                >
                  <div className="px-3 py-4 md:px-5 md:py-5">
                    <h3 className="text-left mb-3 md:mb-4 text-white font-bold text-xl md:text-2xl">
                      Examiner Login
                    </h3>
                    <form onSubmit={handleSubmit}>
                      <div className="form-group mb-3">
                        <input
                          className="form-control p_input w-full"
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "white",
                            padding: "0.75rem",
                            borderRadius: "4px",
                          }}
                          required
                        />
                      </div>
                      <div className="form-group mb-3">
                        <input
                          className="form-control p_input w-full"
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          style={{
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "white",
                            padding: "0.75rem",
                            borderRadius: "4px",
                          }}
                          required
                        />
                      </div>
                      {error && (
                        <div className="text-red-500 mb-2">{error}</div>
                      )}
                      <div className="form-group d-flex align-items-center justify-content-between">
                        <NavLink
                          to="/forgot-pass"
                          className="text-white text-sm md:text-base"
                        >
                          Forgot password
                        </NavLink>
                      </div>
                      <div className="text-center mt-4">
                        <button
                          type="submit"
                          className="btn btn-primary btn-block enter-btn w-full"
                          style={{
                            background: "rgba(59, 130, 246, 0.8)",
                            border: "none",
                            padding: "0.75rem",
                          }}
                        >
                          Login
                        </button>
                      </div>
                      <div className="mt-4 text-center text-white text-sm md:text-base">
                        <p className="mt-2">
                          Faculty Login-
                          <NavLink
                            to="/faculty/login"
                            className="text-blue-300"
                          >
                            {" "}
                            Login
                          </NavLink>
                        </p>
                        <p className="mt-2">
                          Student Login-
                          <NavLink
                            to="/student/login"
                            className="text-blue-300"
                          >
                            {" "}
                            Login
                          </NavLink>
                        </p>
                        <p className="mt-2">
                          User Login-
                          <NavLink to="/" className="text-blue-300">
                            {" "}
                            Login
                          </NavLink>
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Header = () => {
  return (
    <div className="flex items-center justify-between bg-gray-800 py-2 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between w-full md:w-[90%] mx-auto">
        <img
          src="/agnel-logo.png"
          alt="logo"
          className="h-12 md:h-16 mb-2 md:mb-0"
        />
        <div className="text-center md:text-right text-white text-xs md:text-sm">
          <span className="font-bold block md:inline">Bhagubai Changu Thakur College of Law</span>
          <span className="block md:inline md:ml-1">
            Plot No.04, Sector-11, Khanda Colony, New Panvel (W), Raigad, Maharashtra, Pin-410206.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExaminerLogin;
