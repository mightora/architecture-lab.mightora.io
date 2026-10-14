// Original Mightora learning stories. Shared terms are reused across all views.
export function scenarioExamples({e,uml,bpmn}){
 const stories=[{
  id:'birthday',scenario:'Birthday party',name:'Birthday party',start:'2027-03-01',
  context:'organiser [label="Organiser",shape=ellipse]; guests [label="Guests"]; venue [label="Local hall"]; caterer [label="Food supplier"]; organiser -> guests [label="Invitations and replies"]; organiser -> venue [label="Hall booking"]; organiser -> caterer [label="Food arrangements"];',
  flow:'flowchart TD\n A[Agree the party plan] --> B[Invite guests]\n B --> C[Collect replies]\n C --> D{Numbers confirmed?}\n D -->|Yes| E[Confirm food and games]\n D -->|Not yet| F[Follow up replies]\n F --> C\n E --> G[Host the party]',
  sequence:'actor Organiser\nactor Guest\nparticipant "Local hall" as Hall\nparticipant "Food supplier" as Food\nOrganiser -> Hall : Confirm availability\nHall --> Organiser : Hall available\nOrganiser -> Guest : Send invitation\nGuest --> Organiser : Accept invitation\nOrganiser -> Food : Confirm guest numbers\nFood --> Organiser : Food arrangement confirmed',
  states:'stateDiagram-v2\n [*] --> Invited\n Invited --> Accepted: Can attend\n Invited --> Declined: Cannot attend\n Accepted --> Confirmed: Final details shared\n Confirmed --> Attended: Arrives\n Attended --> [*]',
  plan:['Agree party plan','Invite guests','Confirm food and games'],
  dependencies:[['Agree party plan','Book local hall'],['Agree party plan','Invite guests'],['Invite guests','Collect replies'],['Collect replies','Confirm food'],['Book local hall','Plan games'],['Confirm food','Host the party'],['Plan games','Host the party']],
  domain:'class Party {\n date: Date\n venue: String\n}\nclass Guest {\n name: String\n reply: String\n}\nclass Arrangement {\n description: String\n cost: Decimal\n}\nParty "1" -- "0..*" Guest : invites\nParty "1" -- "0..*" Arrangement : needs',
  budget:[['Local hall',100],['Food',70],['Games',60],['Cake',40],['Decorations',30]],
  process:['Collect replies','Confirm food and games','Host the party'],
  layers:'direction: down\npeople: People {\n organiser: Organiser\n guests: Guests\n}\nwork: Work {\n replies: Collect replies\n games: Plan games\n food: Arrange food\n}\nresources: Resources {\n hall: Local hall\n supplier: Food supplier\n}\npeople.organiser -> work.games: Plans\npeople.guests -> work.replies: Respond to\nwork.games -> resources.hall: Uses\nwork.food -> resources.supplier: Coordinates with'
 },{
  id:'moving',scenario:'Moving house',name:'Moving house',start:'2027-04-05',
  context:'household [label="Household",shape=ellipse]; remover [label="Remover"]; utilities [label="Utility providers"]; contacts [label="Friends and organisations"]; household -> remover [label="Move arrangements"]; household -> utilities [label="Address and service changes"]; household -> contacts [label="New address"];',
  flow:'flowchart TD\n A[Confirm the move date] --> B[Make an inventory]\n B --> C[Pack and label boxes]\n C --> D{Everything on the list ready?}\n D -->|No| E[Finish outstanding items]\n E --> C\n D -->|Yes| F[Load and move]\n F --> G[Unpack essentials]',
  sequence:'actor Household\nparticipant Remover\nparticipant "Utility providers" as Utilities\nHousehold -> Remover : Ask about the move date\nRemover --> Household : Confirm availability\nHousehold -> Remover : Confirm inventory and arrangements\nHousehold -> Utilities : Request service changes\nUtilities --> Household : Confirm arrangements\nRemover -> Household : Confirm arrival details',
  states:'stateDiagram-v2\n [*] --> Listed\n Listed --> Packed: Put items in a box\n Packed --> Labelled: Add room label\n Labelled --> Loaded: Load the van\n Loaded --> Delivered: Reach the new home\n Delivered --> Unpacked: Open and check\n Unpacked --> [*]',
  plan:['Confirm move arrangements','Pack and label boxes','Check the moving list'],
  dependencies:[['Confirm move date','Book remover'],['Make inventory','Get packing materials'],['Get packing materials','Pack and label boxes'],['Book remover','Load and move'],['Pack and label boxes','Load and move'],['Load and move','Unpack essentials'],['Confirm move date','Arrange utility changes']],
  domain:'class Move {\n moveDate: Date\n oldAddress: String\n newAddress: String\n}\nclass Box {\n label: String\n destinationRoom: String\n status: String\n}\nclass Item {\n description: String\n}\nMove "1" -- "0..*" Box : transports\nBox "1" -- "0..*" Item : contains',
  budget:[['Remover',250],['Packing materials',40],['Cleaning',80],['Storage',60]],
  process:['Check the moving list','Load and move','Unpack essentials'],
  layers:'direction: down\nhousehold: Household\nwork: Moving work {\n packing: Pack and label boxes\n services: Arrange utility changes\n move: Load and move\n}\nresources: Resources {\n boxes: Packing materials\n utilities: Utility providers\n remover: Remover\n}\nhousehold -> work.packing: Organises\nhousehold -> work.services: Requests\nwork.packing -> resources.boxes: Uses\nwork.services -> resources.utilities: Coordinates with\nwork.move -> resources.remover: Coordinates with'
 },{
  id:'order',scenario:'Online order',name:'Online order',start:'2027-05-03',
  context:'customer [label="Customer",shape=ellipse]; shop [label="Shop"]; payment [label="Payment provider"]; warehouse [label="Warehouse"]; courier [label="Courier"]; customer -> shop [label="Places and tracks order"]; shop -> payment [label="Payment request"]; shop -> warehouse [label="Fulfilment request"]; warehouse -> courier [label="Parcel handover"]; courier -> customer [label="Delivery"];',
  flow:'flowchart TD\n A[Choose an item] --> B[Place an order]\n B --> C{Payment successful?}\n C -->|No| D[Choose another payment method]\n D --> C\n C -->|Yes| E[Pack the order]\n E --> F[Hand parcel to courier]\n F --> G[Deliver to customer]',
  sequence:'actor Customer\nparticipant Shop\nparticipant "Payment provider" as Payment\nparticipant Warehouse\nparticipant Courier\nCustomer -> Shop : Place an order\nShop -> Payment : Request payment\nPayment --> Shop : Payment successful\nShop -> Warehouse : Request fulfilment\nWarehouse -> Courier : Hand over parcel\nCourier --> Customer : Deliver parcel\nCustomer -> Shop : Optional return request',
  states:'stateDiagram-v2\n [*] --> Placed\n Placed --> Paid: Payment successful\n Paid --> Packed: Warehouse packs item\n Packed --> Dispatched: Courier receives parcel\n Dispatched --> Delivered: Customer receives parcel\n Delivered --> ReturnRequested: Customer asks to return\n ReturnRequested --> Returned: Shop receives item\n Returned --> Refunded: Refund completed\n Delivered --> [*]\n Refunded --> [*]',
  plan:['Place an order','Pack the order','Hand parcel to courier'],
  dependencies:[['Choose an item','Place an order'],['Place an order','Confirm payment'],['Confirm payment','Pack the order'],['Pack the order','Hand parcel to courier'],['Hand parcel to courier','Deliver to customer'],['Deliver to customer','Optional return request']],
  domain:'class Customer {\n name: String\n}\nclass Order {\n reference: String\n status: String\n}\nclass OrderLine {\n description: String\n quantity: Integer\n}\nclass Delivery {\n trackingReference: String\n}\nCustomer "1" -- "0..*" Order : places\nOrder "1" -- "1..*" OrderLine : contains\nOrder "1" -- "0..1" Delivery : tracks',
  budget:[['Item',40],['Delivery',5]],
  process:['Confirm payment','Pack the order','Hand parcel to courier'],
  layers:'direction: right\nshop: Shop {\n order: Order handling\n fulfilment: Fulfilment coordination\n}\nexternal: Other responsibilities {\n payment: Payment provider\n warehouse: Warehouse\n courier: Courier\n}\nshop.order -> external.payment: Requests payment\nshop.order -> shop.fulfilment: Passes paid order\nshop.fulfilment -> external.warehouse: Requests packing\nexternal.warehouse -> external.courier: Hands over parcel'
 }];
 const dot=edges=>'digraph Dependencies {\n rankdir=LR;\n node [shape=box,style="rounded,filled",fillcolor="#ecfdf5",color="#059669",fontname="Arial"];\n'+edges.map(([a,b])=>`${JSON.stringify(a)} -> ${JSON.stringify(b)};`).join('\n')+'\n}';
 const chart=s=>JSON.stringify({$schema:'https://vega.github.io/schema/vega-lite/v6.json',description:`Fictional ${s.name.toLowerCase()} budget`,width:500,height:280,data:{values:s.budget.map(([category,budget])=>({category,budget}))},mark:{type:'bar',color:'#059669'},encoding:{x:{field:'category',type:'nominal',axis:{title:null,labelAngle:0}},y:{field:'budget',type:'quantitative',title:'Illustrative cost (£)'}},config:{font:'Arial',view:{stroke:null}}},null,2);
 return stories.flatMap(s=>{
  const extra={scenario:s.scenario};const make=(suffix,p,type,title,purpose,source,more={})=>e(`${s.id}-${suffix}`,p,type,`${s.name}: ${title}`,purpose,source,{...extra,...more});
  const plan='@startgantt\nProject starts '+s.start+'\n'+s.plan.map((task,i)=>`[${task}] lasts ${i+2} days`+(i?`\n[${task}] starts at [${s.plan[i-1]}]'s end`:'')).join('\n')+'\n@endgantt';
  return [
   make('context','graphviz','System context','the people and organisations involved','Establish who is involved and the handoffs across the boundary of the story. Leave detailed steps for a process view.','digraph Context {\n rankdir=LR;\n node [shape=box,style="rounded,filled",fillcolor="#ecfdf5",color="#059669",fontname="Arial"];\n'+s.context+'\n}'),
   make('process','mermaid','Flowchart','the main process and a decision','Follow the main steps and one meaningful decision. Alternative circumstances may need another view.',s.flow),
   make('sequence','plantuml','Sequence','who communicates, and in what order','Read the messages top to bottom. Show the order of communication without implying exact durations.',uml(s.sequence)),
   make('state','mermaid','State','how one thing changes over time','Follow one object through its lifecycle. Each arrow is a change of state rather than another person or system.',s.states,{question:s.id==='birthday'?'How does a guest response change?':s.id==='moving'?'What state is a box in?':'What state is the order in?'}),
   make('plan','plantuml','Gantt','an illustrative plan','Compare duration and sequencing in a simplified plan. The dates and durations are fictional teaching examples.',plan),
   make('dependencies','graphviz','Dependency','what needs to happen first','An arrow means must happen before. Look for work that can progress independently and work that is waiting.',dot(s.dependencies)),
   make('information','plantuml','Class','the information we need','Agree the concepts, attributes and relationships used to describe this story. This is a conceptual model, not a database schema.',uml(s.domain)),
   make('budget','vega','Comparison chart','a fictional budget','Compare the spending categories in the shared story. Amounts are fictional teaching data, not current prices or quotations.',chart(s)),
   make('bpmn','bpmn','Business process','the core process in BPMN','See a focused part of the same process using standard events and tasks. This compact happy path leaves out exceptions.',bpmn(s.name,s.process)),
   make('responsibilities','d2','Container','grouping the responsibilities','Group work and resources to explain responsibilities. The grouping does not prescribe technical deployment.',s.layers)
  ];
 });
}
