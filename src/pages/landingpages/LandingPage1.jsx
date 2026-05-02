import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { getSingleLinkForLandingWithIdAndUniqueId } from "../../utils/Api";
import LandingForm1 from "./LandingForm1";
// import logo from "../../assets/logo.png";

const LandingPage1 = () => {
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(location.search);
      const ref = params.get("ref");
      const rewrite = params.get("rewrite");

      try {
        const validateLink = await fetchOldData(rewrite, ref);
        if (!validateLink?.link) {
          window.location.href = "/404";
        } else {
          if (ref) {
            Cookies.set("referral", ref, { expires: 30 });
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          window.location.href = "/404";
        } else {
          console.error("Error fetching data:", error);
          // Handle other types of errors if necessary
        }
      }
    };

    fetchData();
  }, [location]);

  const fetchOldData = async (id, uniqueId) => {
    return await getSingleLinkForLandingWithIdAndUniqueId({ id, uniqueId });
  };

  return (
    <>
      <section className="pb-4">
        <div className="px-2">
          <img
            src="./logonew.png"
            alt="logo"
            className="w-40 md:w-52 mx-auto"
          />
        </div>
        <div className="w-full md:w-[80%] mx-auto">
          <iframe
            className="rounded-3xl"
            width="100%"
            height="400px"
            src="https://www.youtube.com/embed/1D8yL13DM-U?autoplay=1&si=RS20WzOYM-G5tYko"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
          <div className="flex justify-center mt-4 text-lg md:text-xl">
            <button
              onClick={handleOpen}
              className="w-fit bg-[#d12455] px-4 py-2 rounded-xl font-semibold"
            >
              Register Now
            </button>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div>
          <div className="mx-auto w-fit rounded-xl">
            <img
              loading="lazy"
              alt="rank"
              className="rounded-xl"
              src="./rank.png"
            />
          </div>

          <div className="py-4 text-center">
            <div className="text-xl md:text-3xl font-semibold">
              Ranked 6th in India
              <br />
              By Times In Top Emerging B-Schools
            </div>
            <div className="text-sm md:text-base">
              In a short span of 3 years, DMTIMS has received many recognitions
              for its continuous accomplishments in the field of higher
              education.
            </div>
          </div>
        </div>
        <div className="my-4">
          <div className="text-center text-xl md:text-3xl">
            MBA for Working Professionals
          </div>
          <div className="flex flex-col gap-6 md:gap-10 w-full md:w-[80%] mx-auto">
            <div className="flex gap-4 items-center text-lg md:text-2xl font-semibold">
              <img
                className="w-16 md:w-24 rounded-full"
                src="./clock.png"
                alt="clock"
              />
              <div>Work on Weekdays and Study on the Weekend</div>
            </div>
            <div className="flex gap-4 items-center text-lg md:text-2xl font-semibold">
              <img
                className="w-16 md:w-24 rounded-full"
                src="./cap.png"
                alt="cap"
              />
              <div>International MBA + AICTE Approved PGDM</div>
            </div>
            <div className="flex gap-4 items-center text-lg md:text-2xl font-semibold">
              <img
                src="./books.png"
                alt="books"
                className="w-16 md:w-24 rounded-full"
              />
              <div>Syllabus devised by Industry Experienced Faculty</div>
            </div>
            <div className="flex gap-4 items-center text-lg md:text-2xl font-semibold">
              <img
                src="./360.png"
                alt="360"
                className="w-16 md:w-24 rounded-full"
              />
              <div>All-round Development by Industry Experts</div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="flex justify-center">
          <img
            loading="lazy"
            alt="logo"
            src="./logo.png"
            className="w-40 md:w-60 h-40 md:h-52"
          />
        </div>
        <div className="text-center w-full md:w-[80%] mx-auto">
          <div className="font-semibold text-lg md:text-2xl">
            Seats filling out fast! Register and
            <br />
            Finalize your seat at DMTIMS
          </div>
          <div className="text-sm md:text-xl">
            Obtaining a dual degree in PGDM (Postgraduate Diploma in Management
            Studies) and International MBA (Master of Business Administration)
            from AICTE & a QS 5 Star European University offers a unique and
            comprehensive educational experience that can significantly enhance
            the career prospects and overall skill set of management students.
          </div>
          <div className="font-semibold">DMTIMS + EIU</div>
        </div>
      </section>

      <section className="py-4 bg-white px-4 md:px-8">
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex gap-4 items-center flex-wrap justify-center">
            <img src="./logonew.png" alt="logo1" className="w-40 md:w-52" />
            <img src="./aicte.png" alt="logo2" className="w-32" />
            <img src="./aims.png" alt="logo3" className="w-32" />
            <img src="./acbsp.png" alt="logo4" className="w-32" />
          </div>
          <div className="flex justify-center items-center">
            <img src="./plus.png" alt="plus" className="w-20 md:w-32" />
          </div>
          <div className="flex gap-4 items-center flex-wrap justify-center">
            <img src="./eiu.png" alt="logo5" className="w-40 md:w-52" />
            <img src="./qs.png" alt="logo6" className="w-40 md:w-52" />
            <img src="./asic.jpeg" alt="logo7" className="w-40 md:w-52" />
            <img src="./acbsp2.png" alt="logo8" className="w-40 md:w-52" />
          </div>
        </div>
      </section>

      <LandingForm1 open={open} handleClose={handleClose} />
    </>
  );
};

export default LandingPage1;
