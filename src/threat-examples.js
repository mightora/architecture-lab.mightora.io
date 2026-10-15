// Original Mightora teaching examples, informed by OWASP's threat-modelling questions:
// https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
// Everyday views focus on information and misuse, not physical safety assessments.
export const threatWarning='SAMPLE ONLY - illustrative teaching model, not a security assessment.\nThreats are incomplete; safeguards are proposals, not verified controls.\nValidate scope, likelihood, impact, owners and residual risk before real use.';
const models=[
 {id:'public-application-service',scenario:'Public application service',actor:'Applicant / Staff reviewer',owner:'Service owner',boundary:'Application service boundary',process:'Power Pages / Model-driven app',store:'Dataverse case records and\nprivate submitted documents',partner:'Approved publication / Exchange Online',input:'Application, review and document requests',output:'Approved copies and notifications',
  threats:[
   ['Spoofing','A stolen account submits or reviews a case.','Apply suitable sign-in protections and verify sensitive actions.'],
   ['Information disclosure / elevation of privilege','Changing a case reference exposes another participant document.','Enforce server-side record and file authorisation for every request.'],
   ['Tampering / information disclosure','An unsafe file or unapproved private document is published.','Validate uploads and isolate scanning; require explicit approved publication copies.']
  ],review:'How are file access and reviewer roles tested?\nWho approves publication, and how is access revoked?'},
 {id:'christmas-dinner',scenario:'Christmas dinner',actor:'Guests / Shopper',owner:'Host',boundary:'Family planning boundary',process:'Host coordinates menu and shopping',store:'Guest replies, dietary preferences\nand shopping list',partner:'Shop / family message group',input:'Replies, preferences and list changes',output:'Shopping order and agreed plan',
  threats:[
   ['Spoofing','A fake message changes the payment destination for shopping.','Confirm unexpected payment changes with the Host through a known contact.'],
   ['Tampering','Someone changes the agreed menu or shopping quantities.','Limit editing and confirm important changes with the Host.'],
   ['Information disclosure','A public planning link exposes guest contact and dietary details.','Use private sharing, collect only needed details and remove them after the event.']
  ],review:'Who can edit the plan or forward invitations?\nWho checks changes with Guests? Food safety is outside this model.'},
 {id:'family-holiday',scenario:'Family holiday',actor:'Family / Adults',owner:'Adults coordinating the trip',boundary:'Family itinerary boundary',process:'Adults coordinate bookings and itinerary',store:'Travel dates, booking references\nand contact details',partner:'Airline / Hotel / Local transport',input:'Booking messages and family updates',output:'Booking requests and minimum necessary details',
  threats:[
   ['Spoofing','A fake Airline or Hotel message asks for a new payment.','Verify requests using the provider official app or a known contact.'],
   ['Information disclosure','A shared itinerary reveals when the home is empty.','Restrict itinerary access; avoid public links and unnecessary personal details.'],
   ['Tampering / denial of service','An account takeover changes or cancels a booking.','Protect booking accounts and keep independent confirmation and recovery details.']
  ],review:'Which providers need which details?\nHow will the Family recover access during travel?'},
 {id:'birthday-party',scenario:'Birthday party',actor:'Guests',owner:'Organiser',boundary:'Private party planning boundary',process:'Organiser manages invitations and numbers',store:'Guest replies, contact details\nand party arrangements',partner:'Local hall / Food supplier',input:'Invitations, replies and headcount changes',output:'Venue booking and catering headcount',
  threats:[
   ['Spoofing','Someone impersonates the Local hall and requests a deposit.','Verify unexpected payment instructions through a known hall contact.'],
   ['Tampering','An open reply form allows false attendance changes.','Confirm unusual changes and keep a reviewed guest list.'],
   ['Information disclosure','Forwarded invitations expose private contact details and venue access.','Share invitations privately and give suppliers only the information they need.']
  ],review:'Who can see replies and change the guest list?\nWhen will personal details be deleted? Event safety is out of scope.'},
 {id:'moving-house',scenario:'Moving house',actor:'Household',owner:'Household move coordinator',boundary:'Household move planning boundary',process:'Coordinate inventory and address updates',store:'New address, move dates\nand box inventory',partner:'Remover / Utility providers',input:'Quotes, confirmations and address changes',output:'Move instructions and necessary address details',
  threats:[
   ['Spoofing','A fake Remover requests payment or the new address.','Verify the booking and payment instructions with a known business contact.'],
   ['Information disclosure','A public box list exposes valuables, addresses and move dates.','Restrict inventory sharing and avoid labelling shared lists with unnecessary details.'],
   ['Tampering','A fraudulent message redirects a delivery or utility update.','Confirm changes independently and retain provider acknowledgements.']
  ],review:'Which contacts need the new address and when?\nWho checks changes? Physical security and property purchase are out of scope.'},
 {id:'online-order',scenario:'Online order',actor:'Customer',owner:'Shop service owner',boundary:'Shop application boundary',process:'Shop validates orders and fulfilment',store:'Order records, customer details\nand payment references',partner:'Payment provider / Warehouse / Courier',input:'Order, address and return requests',output:'Payment requests and fulfilment instructions',
  threats:[
   ['Tampering','A modified basket submits a lower price or invalid quantity.','Recalculate prices and validate quantities on the server.'],
   ['Spoofing / tampering','A forged or replayed payment callback triggers fulfilment.','Verify provider authentication, amount and order; process events idempotently.'],
   ['Information disclosure / elevation of privilege','Changing an order identifier exposes another customer address.','Enforce order-level authorisation and share minimal delivery data.']
  ],review:'Who can approve refunds and change delivery details?\nWhat protects accounts and service availability? These paths need further modelling.'},
 {id:'service-request',scenario:'Service request',actor:'Requester / Reviewer',owner:'Request service owner',boundary:'Power Platform service boundary',process:'Power Apps / approval Power Automate flow',store:'Dataverse case and approval records',partner:'Notification delivery',input:'Request, approval and status actions',output:'Case progress and decision notifications',
  threats:[
   ['Spoofing / elevation of privilege','A Requester tries to approve their own request.','Check authorised Reviewer identity and role independently of client inputs.'],
   ['Information disclosure','An over-privileged connection exposes unrelated cases.','Apply least-privilege connections and record-level access rules.'],
   ['Tampering / repudiation','A replayed approval action overwrites a recorded decision.','Validate the current state, handle duplicate actions and retain protected decision history.']
  ],review:'How are connection permissions and Reviewer assignments reviewed?\nWhat happens if the flow or notification service is unavailable?'}
];
export function threatExamples({e,uml}){
 return models.map(m=>{
  const source=uml(String.raw`title ${m.scenario} - illustrative threat model
skinparam shadowing false
skinparam defaultFontName Arial
skinparam rectangleBackgroundColor #ECFDF5
skinparam rectangleBorderColor #059669
skinparam packageBorderColor #64748B
actor "${m.actor}" as User
actor "${m.owner}" as Owner
package "${m.boundary}" {
 rectangle "${m.process}" as Process
 database "${m.store.replace(/\n/g,'\\n')}" as Store
 Process --> Store : Read / write protected information\nT2 - validate access and changes
}
rectangle "${m.partner}" as Partner
User --> Process : ${m.input}\nT1 - verify identity and intent
Process --> Partner : ${m.output}\nT3 - verify recipients and exchanges
Owner ..> Process : Owns review and safeguards
note top of Process #FFF3CD
${threatWarning}
end note
note right of User
Entry point: messages or requests cross a trust boundary.
Being inside a boundary does not make an action trusted.
end note
${m.threats.map(([category,threat,control],i)=>`note ${i===0?'left':i===1?'bottom':'right'} of ${i===0?'Process':i===1?'Store':'Partner'} #FFF3CD
T${i+1} - ${category}
Threat: ${threat}
Candidate safeguard: ${control}
end note`).join('\n')}
legend bottom
Scope: information, access and misuse in this fictional scenario.
T1-T3 identify discussion prompts, not a complete risk register.
No risk score, control effectiveness or compliance is asserted.
Open questions for review:
${m.review}
endlegend`);
  return e(`threat-${m.id}-plantuml`,'plantuml','Threat model',`${m.scenario} - sample threat model`,
   'SAMPLE ONLY: an illustrative teaching model, not a security assessment. Explore assets, trust boundaries, three possible threats and candidate safeguards; these controls are not verified.',source,
   {scenario:m.scenario,level:'Intermediate',question:'What could go wrong, what needs protection, and what should we check?',leavesOut:'A complete threat inventory, tested controls, likelihood and impact ratings, assigned actions and accepted residual risks. Review and validate before real use.'});
 });
}
