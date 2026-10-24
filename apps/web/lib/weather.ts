export type BimarisWeatherCondition="sunny"|"partly-cloudy"|"cloudy"|"rain"|"storm"|"windy";
export type BimarisWeatherSnapshot={condition:BimarisWeatherCondition;temperatureC:number;rain:boolean;strongWind:boolean;extremeHeat:boolean;roughSea:boolean;provider:string;observedAt:Date};

type Hourly={time:string[];temperature_2m:number[];precipitation:number[];weather_code:number[];wind_speed_10m:number[];wind_gusts_10m:number[]};
type Forecast={hourly?:Hourly};

function condition(code:number,wind:number):BimarisWeatherCondition{if(code>=95)return"storm";if(code>=51)return"rain";if(wind>=45)return"windy";if(code===0)return"sunny";if(code<=2)return"partly-cloudy";return"cloudy"}
function nearest(times:string[],target:Date){let best=0,diff=Infinity;for(let i=0;i<times.length;i++){const d=Math.abs(new Date(times[i]).getTime()-target.getTime());if(d<diff){diff=d;best=i}}return best}

/**
 * Temporary development adapter. Open-Meteo's free endpoint is non-commercial;
 * keep the Discovery engine provider-independent so this can be replaced by
 * MeteoHub before BIMARIS commercial/public launch.
 */
export async function getDevelopmentWeather(target=new Date(),latitude=38.1938,longitude=15.5540):Promise<BimarisWeatherSnapshot|null>{
 try{
  const url=new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",String(latitude));url.searchParams.set("longitude",String(longitude));url.searchParams.set("hourly","temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m");url.searchParams.set("timezone","Europe/Rome");url.searchParams.set("forecast_days","3");url.searchParams.set("models","italia_meteo_arpae_icon_2i");
  const response=await fetch(url,{next:{revalidate:1800}});if(!response.ok)return null;const data=await response.json() as Forecast,h=data.hourly;if(!h?.time?.length)return null;const i=nearest(h.time,target),temperature=Number(h.temperature_2m?.[i]??0),precipitation=Number(h.precipitation?.[i]??0),code=Number(h.weather_code?.[i]??3),wind=Number(h.wind_speed_10m?.[i]??0),gust=Number(h.wind_gusts_10m?.[i]??0);
  return {condition:condition(code,wind),temperatureC:temperature,rain:precipitation>.1||code>=51&&code<95,strongWind:wind>=35||gust>=50,extremeHeat:temperature>=35,roughSea:false,provider:"ItaliaMeteo ICON-2I via Open-Meteo (sviluppo)",observedAt:target};
 }catch{return null}
}
