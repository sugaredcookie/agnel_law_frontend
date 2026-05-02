import React, { useContext, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
// import { StreamContext } from "../../../StreamContext";
import { getSingleProgramViaAdmin } from "../../../utils/Api";

const StreamForm = () => {
  // const { addStream } = useContext(StreamContext);
  const navigate = useNavigate();

  // console.log("StreamForm -> addStream", addStream);
  const [streamData, setStreamData] = useState({
    streamName: "",
    terms: "",
    vision: "",
    mission: "",
  });

  const { id } = useParams();

  const handleChange = (e) => {
    const { id, value } = e.target;

    setStreamData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // addStream(streamData);
    if (!id) {
      navigate("/panel-admin/add-new-program-form");
    } else {
      navigate(`/panel-admin/edit-program-form/${id}`);
    }
  };

  return (
    <PanelDashboardLayout>
      <div className="card col-lg-4 mx-auto">
        <div className="card-body px-5 py-5">
          <h3 className=" mb-5 alert alert-warning">Add Stream</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="streamName">Stream Name</label>
              <input
                type="text"
                className="form-control"
                id="streamName"
                placeholder="Enter Stream Name"
                value={streamData.streamName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="terms">Number of terms</label>
              <input
                type="number"
                min={1}
                max={10}
                className="form-control"
                id="terms"
                placeholder="Enter no. of terms"
                value={streamData.terms}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vision">Vision</label>
              <textarea
                className="form-control"
                id="vision"
                rows="3"
                placeholder="Enter vision"
                value={streamData.vision}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="mission">Mission</label>
              <textarea
                className="form-control"
                id="mission"
                rows="3"
                placeholder="Enter mission"
                value={streamData.mission}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn-primary mt-3">
              Submit
            </button>
          </form>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default StreamForm;
