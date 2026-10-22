"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LogoutButton(){
 const router=useRouter();
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 async function logout(){
  const supabase=createBrowserSupabaseClient();
  if(!supabase){setError("Uscita non disponibile in questo momento.");return;}
  setLoading(true);setError("");
  const {error:signOutError}=await supabase.auth.signOut();
  if(signOutError){setLoading(false);setError("Non è stato possibile uscire. Riprova.");return;}
  router.replace("/accedi/utente");
  router.refresh();
 }

 return <div className="profile-session-actions">
  <button type="button" className="profile-logout" onClick={logout} disabled={loading}>{loading?"Uscita…":"Esci"}</button>
  {error&&<span className="profile-logout-error" role="status">{error}</span>}
 </div>;
}
