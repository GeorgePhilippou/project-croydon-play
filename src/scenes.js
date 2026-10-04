// Directional door choices are derived from the supplied Apollo House Flat 5 plan.
// Both hallway cameras face north. Backgrounds are generated art, not reference screenshots.
export const rooms = [
 {id:'vestibule',name:'Entrance vestibule'},
 {id:'entrance',name:'Lower hallway'}, {id:'hall',name:'Upper hallway'},
 {id:'mark',name:'Mark’s room'}, {id:'bathroom',name:'Bathroom'},
 {id:'living',name:'Living room'}, {id:'jez',name:'Jez’s room'}, {id:'kitchen',name:'Kitchen'},
];
function scene(id,name,art,description,links={},hotspots=[]){
 return {id,room:id.split('-')[0],name,background:`assets/scenes/styled/${art}.png?v=c181deae1436`,description,
 left:null,right:null,forward:null,...links,hotspots,certainty:'reference-informed generated art'};
}
const door=(label,target,x,y,width,height)=>({label,target,x,y,width,height});
export const scenes={
 'vestibule-0':scene('vestibule-0','Entrance','entrance-west','Just inside the front door. Turn right into the hallway.',{right:'entrance-0'},[door('Turn right into the hallway','entrance-0',84,47,28,78)]),
 'entrance-0':scene('entrance-0','Lower hallway','hall-lower-v2','Just inside the front door.',
 {left:'mark-0',right:'bathroom-0',forward:'hall-0'},[
  door('← Mark’s room','mark-0',11,45,17,76),door('Bathroom →','bathroom-0',90,45,17,76),door('Hallway ↑','hall-0',53,53,38,60)]),
 'hall-0':scene('hall-0','Upper hallway','hall-upper','Three doors. One small domestic crisis.',
 {left:'living-0',right:'kitchen-0',forward:'jez-0'},[
  door('← Living room','living-0',16,45,22,74),door('Kitchen →','kitchen-0',90,46,18,76),door('Jez’s room ↑','jez-0',51,44,22,66)]),
 'mark-0':scene('mark-0','Mark’s room','mark-v3','Books, a desk, and everything in its place.',{},[{object:'pharaohs-book',label:'Inspect the desk',x:6.7,y:55,width:9,height:8},{object:'jlb-pass',label:'Inspect beside the computer',x:24,y:50,width:8,height:8}]),
 'bathroom-0':scene('bathroom-0','Bathroom','bathroom','Behind the patterned hanging.'),
 'living-0':scene('living-0','Living room','living-v2','The familiar sofa, sideboard and elephant.',{},[{object:'hans-trainers',label:'Inspect beside the sofa',x:80,y:80,width:12,height:12}]),
 'jez-0':scene('jez-0','Jez’s room','jez-v3','Orange walls, instruments and unfinished ambitions.',{},[{object:'jez-bong',label:'Inspect the record shelf',x:11,y:43,width:7,height:15},{object:'rainbow-flyer',label:'Inspect the wall flyer',x:26.5,y:23,width:7,height:13}]),
 'kitchen-0':scene('kitchen-0','Kitchen','kitchen-v4','Green walls, blue cupboards and a checked table.',{},[
  {object:'red-toolbox',label:'Inspect the open shelf',x:85,y:38,width:18,height:16},{object:'christmas-turkey',label:'Inspect the roasting tin',x:75,y:55,width:18,height:15}]),
};
export const startScene='vestibule-0';
