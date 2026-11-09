import { createUserServerClient } from "@/lib/supabase/user-server";
import OperatorWorkspaceNavigation from "./OperatorWorkspaceNavigation";
import "./correction-actions.css";
import "./operator-navigation.css";

type Operator = {id:string;slug:string;name:string};
type Membership = {operator_id:string;operators:Operator|Operator[]|null};
export default async function AreaOperatoreLayout({children}:{children:React.ReactNode}) {
 const db=await createUserServerClient();
 let activities:Operator[]=[];
 if(db){
  const {data:claims}=await db.auth.getClaims();
  const userId=typeof claims?.claims?.sub==="string"?claims.claims.sub:null;
  if(userId){
   const {data}=await db.from("operator_memberships").select("operator_id,operators(id,slug,name)").eq("user_id",userId);
   activities=((data??[]) as Membership[]).map(m=>Array.isArray(m.operators)?m.operators[0]??null:m.operators).filter((v):v is Operator=>Boolean(v));
  }
 }
 return <><OperatorWorkspaceNavigation activities={activities}/>{children}</>;
}
