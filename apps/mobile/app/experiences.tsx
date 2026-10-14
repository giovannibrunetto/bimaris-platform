import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { mobileExperiences } from "@/src/data";
import { theme } from "@/src/theme";
import { trackMobile } from "@/src/analytics";

export default function ExperiencesScreen(){return <ScrollView contentContainerStyle={styles.page}>{mobileExperiences.map(e=><TouchableOpacity key={e.id} style={styles.card} onPress={()=>trackMobile("experience_view",{experience_id:e.id,experience_name:e.title})}><View style={styles.media}/><View style={styles.body}><Text style={styles.category}>{e.category}</Text><Text style={styles.title}>{e.title}</Text><Text style={styles.subtitle}>{e.subtitle}</Text></View></TouchableOpacity>)}</ScrollView>}
const styles=StyleSheet.create({page:{padding:18,gap:18},card:{backgroundColor:"white",borderRadius:20,overflow:"hidden",borderWidth:1,borderColor:"#e0e5e8"},media:{height:160,backgroundColor:theme.navy2},body:{padding:18},category:{fontSize:11,color:"#8a6d3d",fontWeight:"700",letterSpacing:1.3},title:{fontFamily:"serif",fontSize:27,marginTop:7,color:theme.ink},subtitle:{color:theme.muted,lineHeight:21,marginTop:8}})
