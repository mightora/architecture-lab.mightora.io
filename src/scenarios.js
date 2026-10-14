export const scenarios=[
 {id:'christmas-dinner',name:'Christmas dinner',kind:'Everyday',summary:'Bring the family together for dinner.',story:'The Host coordinates Christmas dinner. Guests confirm attendance and preferences, the Shopper works from an agreed list, and the family shares preparation and clearing up.',people:['Host','Guests','Shopper','Family'],facts:['Agree the menu before buying ingredients.','Guest replies affect food and seating.','The illustrative budget totals £140.'],start:'christmas-menu-flow'},
 {id:'family-holiday',name:'Family holiday',kind:'Everyday',summary:'Plan a trip everyone can enjoy.',story:'The Family agrees dates and a budget. Adults arrange flights and accommodation, coordinate a local transfer and share the itinerary. Everyone helps choose activities and prepare for the journey.',people:['Family','Adults','Airline','Hotel','Local transport'],facts:['Bookings and transfers need to fit together.','Preparation dates are illustrative.','The fictional budget totals £1,920.'],start:'holiday-family-journey'},
 {id:'birthday-party',name:'Birthday party',kind:'Everyday',summary:'Turn a party idea into a shared celebration.',story:'The Organiser plans a birthday party at a Local hall, with food and games. Guests reply to invitations. Confirmed numbers guide the food arrangements, and the Organiser coordinates the hall and Food supplier.',people:['Organiser','Guests','Local hall','Food supplier'],facts:['Guest replies affect food arrangements.','The plan dates are fictional teaching slots.','The fictional budget totals £300.'],start:'birthday-context'},
 {id:'moving-house',name:'Moving house',kind:'Everyday',summary:'Coordinate the work before and after moving day.',story:'The Household is moving to a new home. It makes an inventory, packs and labels boxes, books a Remover, arranges changes with Utility providers and shares the new address with relevant contacts.',people:['Household','Remover','Utility providers','Friends and organisations'],facts:['A Box moves from Listed to Unpacked.','The scope is move coordination, not property purchase.','The fictional budget totals £430.'],start:'moving-context'},
 {id:'online-order',name:'Online order',kind:'Everyday',summary:'Follow a purchase from selection to delivery.',story:'A Customer buys an item from a Shop. The Payment provider confirms payment, the Warehouse packs the order and the Courier delivers it. A separate path illustrates an optional return and refund.',people:['Customer','Shop','Payment provider','Warehouse','Courier'],facts:['Packing follows successful payment in this story.','The return path is illustrative, not a shop policy.','The fictional item is £40 plus £5 delivery.'],start:'order-context'},
 {id:'service-request',name:'Service request',kind:'Professional',summary:'Connect the everyday lessons to a digital service.',story:'A Requester submits a case through Power Apps. Dataverse holds the case, Power Automate coordinates approval, and a Reviewer decides the outcome. Notifications help the Requester follow progress.',people:['Requester','Reviewer','Power Apps','Dataverse','Power Automate'],facts:['Different views focus on people, messages, data or hosting.','Views use a shared request and approval vocabulary.','This is an illustrative solution, not a prescribed design.'],start:'pu-components'}
];
const views={
 'System context':['Who and what is involved?','Detailed internal steps and timing.'],
 'Component':['Which responsibilities support the story?','Message ordering and exact hosting arrangements.'],
 'Container':['How are the responsibilities grouped?','Detailed behaviour inside each group.'],
 'Layered architecture':['How do people, work and resources connect?','Exact timing and formal model validation.'],
 'ArchiMate-style':['Why change, and what supports the goal?','Automated validation of an enterprise model.'],
 'Flowchart':['What happens, and where are the decisions?','Detailed message exchanges between participants.'],
 'Activity':['Which activities happen, including in parallel?','Detailed data structures and exact durations.'],
 'Business process':['What is the process from start to finish?','Exceptions not included in this focused process.'],
 'Dependency':['What needs to happen first?','How long the work takes.'],
 'Sequence':['Who communicates, and in what order?','Exact duration and every possible exception.'],
 'State':['How can something change status?','The wider plan and other objects’ lifecycles.'],
 'Gantt':['When does the work happen, and for how long?','Detailed conversations and data structures.'],
 'Timeline':['What are the major milestones?','Task duration and resource availability.'],
 'Class':['What information and relationships do we need?','Storage choices and user-interface design.'],
 'Entity relationship':['How is the information related?','The user journey and order of activities.'],
 'Comparison chart':['Where does the illustrative budget go?','Live prices and unlisted costs.'],
 'Trend chart':['How does a measure change over time?','The causes behind every change.'],
 'User journey':['What is the experience like for the people involved?','Detailed internal system behaviour.'],
 'Mind map':['What do we need to think about?','A committed sequence or delivery schedule.'],
 'Timing':['Which things overlap over time?','Detailed process rules; slots are illustrative.'],
 'Register':['How are the fields arranged?','End-to-end process behaviour.'],
 'Visual architecture':['How would we sketch the relationships together?','Automatic checks of the meaning of the drawing.'],
 'Deployment':['Where do the runtime parts live?','The complete user experience.'],
 'Network':['What connects across the boundaries?','Detailed message ordering.'],
 'Use case':['Which goals belong to which people?','The steps inside each goal.'],
 'Git graph':['How do changes branch and come together?','The architecture implemented by those changes.']
};
export const questionFor=e=>e.question||views[e.type]?.[0]||'What does this view help us understand?';
export const limitFor=e=>e.leavesOut||views[e.type]?.[1]||'Other views of the same story.';
export const scenarioFor=name=>scenarios.find(s=>s.name===name);
export function filterExamples(examples,{search='',scenario='all',platform='all',type='all'}={}){
 const q=search.toLowerCase().trim();return examples.filter(e=>(scenario==='all'||e.scenario===scenario)&&(platform==='all'||e.platform===platform)&&(type==='all'||e.type===type)&&`${e.title} ${e.purpose} ${e.type} ${e.platform} ${e.scenario} ${questionFor(e)}`.toLowerCase().includes(q));
}
