import type { ReactNode } from "react";
import "./interest-choice.css";

export default function OperatorInterestLayout({children}:{children:ReactNode}){
 const apiKey=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
 return <div className="operator-interest-page">
  {apiKey?<script src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places`} />:null}
  {children}
 </div>;
}
