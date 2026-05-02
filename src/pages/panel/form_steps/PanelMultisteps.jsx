import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";

import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";

import { useNavigate } from "react-router-dom";
import { getSingleFormDataForAdmin } from "../../../utils/Api";
import { useParams } from "react-router-dom";
import PanelDashboardLayout from "../PanelDashboardLayout";
const steps = ["Student Details", "Academic Details", "Certificates"];

export default function PanelMultisteps() {
  const { id } = useParams();
  const [oldFormData, setOldFormData] = useState({});
  const [oldDataCame, setOldDataCame] = useState(false);
  const [formId, setFormId] = useState(id || null);
  const [activeStep, setActiveStep] = React.useState(0);

  // Add function to update form data
  const updateFormData = (newData) => {
    setOldFormData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  };

  // Add more detailed logging
  useEffect(() => {
    console.log("Form ID changed:", formId);
    console.log("Old Form Data:", oldFormData);
  }, [formId, oldFormData]);

  console.log(id);
  useEffect(() => {
    if (id) {
      fetchSingleFormDataFromAPI();
    }
  }, []);

  const fetchSingleFormDataFromAPI = async () => {
    try {
      const response = await getSingleFormDataForAdmin(id);
      setOldFormData(response);
      setFormId(response._id); // Set formId from API response
      console.log("Setting formId from API:", response._id);
      setOldDataCame(true);
    } catch (error) {
      console.log(error);
    }
  };

  const navigate = useNavigate();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const stepsToRender = [
    <Step1
      key="step1"
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      oldFormData={oldFormData}
      oldDataCame={oldDataCame}
      setFormId={setFormId}
      updateFormData={updateFormData}
    />,
    <Step2
      key="step2"
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      oldFormData={{
        ...oldFormData,
        _id: formId || oldFormData?._id, // Ensure ID is passed from either source
      }}
      oldDataCame={oldDataCame}
      updateFormData={updateFormData}
    />,
    <Step3
      key="step3"
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      oldFormData={{
        ...oldFormData,
        _id: formId || oldFormData?._id, // Ensure ID is passed from either source
      }}
      oldDataCame={oldDataCame}
      updateFormData={updateFormData}
    />,
  ];

  return (
    <PanelDashboardLayout>
      <div className="row">
        <div className="col-md-8 mx-auto">
          <Box sx={{ width: "100%" }}>
            <Stepper activeStep={activeStep}>
              {steps.map((label, index) => {
                const stepProps = {};
                const labelProps = {};

                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel {...labelProps}>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>

            <>
              <div className="my-5">
                {/* // render steps */}
                {stepsToRender[activeStep]}
              </div>
            </>
          </Box>
        </div>
      </div>
    </PanelDashboardLayout>
  );
}
