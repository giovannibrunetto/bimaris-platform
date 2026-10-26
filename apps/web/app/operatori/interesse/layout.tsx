import type { ReactNode } from "react";

export default function OperatorInterestLayout({children}:{children:ReactNode}){
 const apiKey=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
 return <>
  {apiKey?<script src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places`} />:null}
  {children}
 </>;
}
