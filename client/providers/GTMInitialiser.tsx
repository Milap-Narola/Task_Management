"use client";
import { useEffect } from "react";
import TagManager from "react-gtm-module";

const GTMInitialiser = () => {
  useEffect(() => {
    const tagManagerArgs = {
      gtmId: "GTM-NGW9WFTP",
    };

    TagManager.initialize(tagManagerArgs);
  }, []);
  return null;
}

export default GTMInitialiser;
