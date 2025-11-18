import React from "react";
import "./OrbiCircle.css";

/**
 * status:
 *  - "idle"
 *  - "listening"
 *  - "speaking"
 */
const OrbiCircle = ({ status = "idle" }) => {
  return (
    <div className={`orbi-wrapper orbi-${status}`}>
      <div className="orbi-core" />
      <div className="orbi-ring orbi-ring-1" />
      <div className="orbi-ring orbi-ring-2" />
      <div className="orbi-ring orbi-ring-3" />
    </div>
  );
};

export default OrbiCircle;
