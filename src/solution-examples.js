// Fictional learning scenario. No customer, organisation, tenant or resource identifiers.
export function solutionExamples({e,uml}){
 const scenario='Public application service';
 const common='skinparam shadowing false\nskinparam componentStyle rectangle\nskinparam defaultFontName Arial\nskinparam rectangleBackgroundColor #ECFDF5\nskinparam rectangleBorderColor #059669\nskinparam packageBackgroundColor #F4F8F6\nskinparam packageBorderColor #64748B\n';
 const views=[{
 id:'concepts',type:'Core concepts model',title:'Core concepts model',question:'Which business concepts exist, and how are they related?',
 purpose:'Agree the business vocabulary and example cardinalities for a fictional application and case service before designing tables.',
 leavesOut:'Physical tables, column types, security roles and process order. Cardinalities are teaching assumptions, not domain rules.',
 plant:String.raw`title Core concepts model - fictional application service
class "Case" as Case
class "Application" as Application
class "Interested party" as Party
class "Submission" as Submission
class "Document" as Document
class "User account" as Account
class "Representation" as Representation
Case "1" -- "1" Application : is opened for
Case "1" -- "0..*" Party : involves
Account "1" -- "0..*" Application : submits
Party "1" -- "0..*" Submission : makes
Case "1" -- "0..*" Submission : receives
Submission "1" -- "1..*" Document : contains
Party "1" -- "0..*" Representation : permits
Account "1" -- "0..*" Representation : acts through
note bottom of Case
An accepted application opens one case.
An interested party may act without a representative.
A submission contains at least one document in this story.
end note`,
 platform:'mermaid',alt:`erDiagram
 CASE ||--|| APPLICATION : opened_for
 USER_ACCOUNT ||--o{ APPLICATION : submits
 CASE ||--o{ INTERESTED_PARTY : involves
 INTERESTED_PARTY ||--o{ SUBMISSION : makes
 CASE ||--o{ SUBMISSION : receives
 SUBMISSION ||--|{ DOCUMENT : contains
 INTERESTED_PARTY ||--o{ REPRESENTATION : permits
 USER_ACCOUNT ||--o{ REPRESENTATION : acts_through`
 },{
 id:'capabilities',type:'Solution capabilities map',title:'Solution capabilities map',question:'What must the solution enable people to do?',
 purpose:'Group stable business abilities into self-service, case operations and supporting capabilities. Use the map to discuss scope and ownership.',
 leavesOut:'Screen design, implementation components, delivery dates and capability maturity scores.',
 plant:String.raw`title Solution capabilities map - fictional application service
package "Self-service" {
 rectangle "Browse published information" as Browse
 rectangle "Manage account" as Account
 rectangle "Submit application" as Apply
 rectangle "Provide supporting documents" as Upload
 Browse -[hidden]down-> Account
 Account -[hidden]down-> Apply
 Apply -[hidden]down-> Upload
}
package "Case operations" {
 rectangle "Triage applications" as Triage
 rectangle "Manage interested parties" as Parties
 rectangle "Review submissions" as Review
 rectangle "Record decisions" as Decide
 Triage -[hidden]down-> Parties
 Parties -[hidden]down-> Review
 Review -[hidden]down-> Decide
}
package "Supporting capabilities" {
 rectangle "Notify people" as Notify
 rectangle "Manage documents" as Documents
 rectangle "Publish approved information" as Publish
 rectangle "Audit activity" as Audit
 Notify -[hidden]down-> Documents
 Documents -[hidden]down-> Publish
 Publish -[hidden]down-> Audit
}
note bottom
Grouping indicates scope, not a sequence of steps.
Capability ownership and implementation are separate decisions.
end note`,
 platform:'graphviz',alt:`digraph capabilities {
 graph [rankdir=TB,compound=true];
 node [shape=box,style="rounded,filled",fillcolor="#ecfdf5",color="#059669",fontname="Arial"];
 subgraph cluster_self { label="Self-service"; browse [label="Browse published information"]; account [label="Manage account"]; apply [label="Submit application"]; upload [label="Provide supporting documents"]; browse -> account -> apply -> upload [style=invis]; }
 subgraph cluster_case { label="Case operations"; triage [label="Triage applications"]; parties [label="Manage interested parties"]; review [label="Review submissions"]; decision [label="Record decisions"]; triage -> parties -> review -> decision [style=invis]; }
 subgraph cluster_support { label="Supporting capabilities"; notify [label="Notify people"]; docs [label="Manage documents"]; publish [label="Publish approved information"]; audit [label="Audit activity"]; notify -> docs -> publish -> audit [style=invis]; }
}`
 },{
 id:'data-flow',type:'High-level data flow',title:'High-level data flow diagram',question:'What information moves, and where is it stored?',
 purpose:'Trace application fields, private document content, approved publication copies and notifications across logical processes and stores.',
 leavesOut:'Exact API calls, authentication exchanges, database columns, protocol details and deployment topology.',
 plant:String.raw`title High-level data flow - fictional application service
actor "Applicant" as Applicant
actor "Staff reviewer" as Staff
component "Public application portal\nPower Pages" as Portal
component "Case workspace\nModel-driven app" as Workspace
component "Document service\nAzure Function" as Documents
component "Business automation\nPower Automate" as Automation
component "Public information site\nStatic Web App" as PublicSite
component "Email delivery\nExchange Online" as Email
database "Case and application records\nDataverse" as Records
folder "Submitted documents\nPrivate Azure Storage" as PrivateDocs
folder "Approved publication copies\nPublic Azure Storage" as PublicDocs
Applicant --> Portal : Application fields and supporting content
Portal --> Records : Application and interested-party data
Portal --> Documents : Authorised document request
Documents --> PrivateDocs : File content
Documents --> Records : Document reference and case link
Staff --> Workspace : Review and decision information
Workspace --> Records : Case updates
Records --> Automation : Relevant record changes
Automation --> Email : Notification content
Email --> Applicant : Submission receipt or case update
Automation --> PublicDocs : Approved publication copy only
PublicDocs --> PublicSite : Published information
PublicSite --> Applicant : Public information
note bottom
Publication is a separate authorised decision.
Private submissions do not become public automatically.
end note`,
 platform:'mermaid',alt:`flowchart TD
 Applicant[Applicant] -->|Application fields and documents| Portal[Power Pages portal]
 Portal -->|Application and party data| Records[(Dataverse case records)]
 Portal -->|Authorised document request| Documents[Document service]
 Documents -->|File content| Private[(Private submitted documents)]
 Documents -->|Document reference and case link| Records
 Staff[Staff reviewer] -->|Review and decision| Workspace[Model-driven app]
 Workspace -->|Case updates| Records
 Records -->|Relevant record changes| Automation[Power Automate]
 Automation -->|Notification content| Email[Exchange Online]
 Email -->|Receipt or case update| Applicant
 Automation -->|Approved publication copy only| Public[(Public publication copies)]
 Public -->|Published information| Site[Static public information site]
 Site -->|Public information| Applicant`
 },{
 id:'user-flow',type:'User logical flow',title:'External user logical flow',question:'In what order does an applicant interact with the service?',
 purpose:'Show public browsing, optional sign-in, application validation, private document submission and asynchronous notification as a sequence.',
 leavesOut:'Every exception, token claims, exact endpoints, performance timings and physical deployment. The upload service is an illustrative integration design.',
 plant:String.raw`title External user logical flow - fictional application service
actor "Applicant" as Applicant
participant "Public web delivery\nFront Door and WAF" as Edge
participant "Public information site" as Site
participant "Power Pages portal" as Portal
participant "Customer identity\nExisting Azure B2C tenant" as Identity
participant "Document service" as Documents
database "Dataverse" as Records
collections "Private submitted documents" as PrivateDocs
participant "Power Automate" as Automation
participant "Exchange Online" as Email
Applicant -> Edge : Request published information
Edge -> Site : Route public site request
Site --> Applicant : Published information
opt Applicant chooses to submit an application
 Applicant -> Portal : Open application form
 Portal --> Applicant : Request sign-in
 Applicant -> Identity : Authenticate
 Identity --> Applicant : Sign-in result
 Applicant -> Portal : Continue authenticated session
 Applicant -> Portal : Enter application fields
 alt Form passes validation
  Portal -> Records : Save application and case records
  Records --> Portal : Case reference
  Applicant -> Portal : Provide supporting document
  Portal -> Documents : Authorised upload request and case reference
  Documents -> PrivateDocs : Store validated content
  Documents -> Records : Record document reference
  Portal --> Applicant : Submission confirmation
  Records ->> Automation : Relevant record-change trigger
  Automation ->> Email : Queue notification
  Email ->> Applicant : Submission receipt
 else Form needs correction
  Portal --> Applicant : Show validation messages
 end
end
note over Edge,Identity
Identity sign-in is separate from public web routing.
The gateway is not depicted as protecting the B2C endpoint.
end note`,
 platform:'mermaid',alt:`sequenceDiagram
 actor Applicant
 participant Web as Public web delivery
 participant Site as Public information site
 participant Portal as Power Pages
 participant Identity as Existing customer identity
 participant Records as Dataverse
 participant Documents as Document service
 participant Store as Private document store
 participant Automation as Power Automate
 participant Email as Exchange Online
 Applicant->>Web: Request published information
 Web->>Site: Route public site request
 Site-->>Applicant: Published information
 opt Choose to submit application
  Applicant->>Portal: Open application form
  Portal-->>Applicant: Request sign-in
  Applicant->>Identity: Authenticate
  Identity-->>Applicant: Sign-in result
  Applicant->>Portal: Continue authenticated session
  Applicant->>Portal: Enter application fields
  alt Form passes validation
   Portal->>Records: Save application and case
   Records-->>Portal: Case reference
   Applicant->>Portal: Provide document
   Portal->>Documents: Authorised upload request
   Documents->>Store: Store validated content
   Documents->>Records: Document reference
   Portal-->>Applicant: Submission confirmation
   Records-)Automation: Record-change trigger
   Automation-)Email: Queue notification
   Email-)Applicant: Submission receipt
  else Form needs correction
   Portal-->>Applicant: Validation messages
  end
 end`
 },{
 id:'workloads',type:'Workload separation',title:'Workload separation and integration points',question:'Which workload owns each responsibility, and where does it integrate?',
 purpose:'Separate public delivery, case management, private document processing, customer identity and Microsoft 365 integrations. Distinguish data exchanges from identity-policy relationships.',
 leavesOut:'Resource provisioning, migration, network routes, detailed API contracts and the full Azure resource-management control plane.',
 plant:String.raw`title Workload separation and integration points - fictional service
actor "Applicant" as Applicant
actor "Staff reviewer" as Staff
package "Identity and access policies" {
 component "Customer identity\nExisting Azure B2C tenant" as Identity
 component "Staff identity and policy\nEntra ID / Conditional Access" as StaffIdentity
}
package "Public delivery workload" {
 component "Front Door and WAF" as Edge
 component "Public information site\nStatic Web App" as Site
 folder "Approved publication copies" as PublicDocs
}
package "Case-management workload" {
 component "Power Pages portal" as Portal
 component "Model-driven app" as Workspace
 database "Dataverse" as Records
 component "Power Automate" as Automation
}
package "Private document workload" {
 component "Document service\nAzure Function" as Documents
 folder "Private submitted documents" as PrivateDocs
}
package "Microsoft 365 integration" {
 component "SharePoint\nInternal collaboration" as SharePoint
 component "Exchange Online\nNotification delivery" as Email
}
Applicant --> Edge : Browse published information
Edge --> Site : Deliver public site
Site --> PublicDocs : Read approved copies
Applicant --> Portal : Authenticated application actions
Portal ..> Identity : Sign-in integration
Staff ..> StaffIdentity : Identity and policy evaluation
Staff --> Workspace : Case operations
Workspace ..> StaffIdentity : Sign-in integration
Staff --> SharePoint : Internal collaboration
Portal --> Records : Application and case data
Workspace --> Records : Review data
Portal --> Documents : Authorised document requests
Documents --> PrivateDocs : Private content
Documents --> Records : Metadata references
Records --> Automation : Asynchronous record changes
Automation --> SharePoint : Selected internal collaboration data
Automation --> Email : Notification content
Automation --> PublicDocs : Approved publication copies only
legend bottom
Solid arrows: workload access or information exchange.
Dotted arrows: identity or policy relationship, not a network hop.
Migration is deliberately outside this end-state view.
endlegend`,
 platform:'d2',alt:`direction: down
applicant: Applicant
staff: Staff reviewer
identity: Identity and access policies {
 customer: Existing Azure B2C customer identity
 workforce: Entra ID and Conditional Access
}
public: Public delivery workload {
 edge: Front Door and WAF
 site: Static public information site
 copies: Approved publication copies
}
cases: Case-management workload {
 portal: Power Pages portal
 workspace: Model-driven app
 records: Dataverse
 automation: Power Automate
}
documents: Private document workload {
 api: Document service - Azure Function
 store: Private submitted documents
}
m365: Microsoft 365 integration {
 collaboration: SharePoint
 email: Exchange Online
}
applicant -> public.edge: Browse public information
public.edge -> public.site: Deliver site
public.site -> public.copies: Read approved copies
applicant -> cases.portal: Application actions
cases.portal -> identity.customer: Sign-in integration
staff -> identity.workforce: Identity and policy evaluation
staff -> cases.workspace: Case operations
cases.workspace -> identity.workforce: Sign-in integration
staff -> m365.collaboration: Internal collaboration
cases.portal -> cases.records: Application data
cases.workspace -> cases.records: Review data
cases.portal -> documents.api: Authorised document request
documents.api -> documents.store: Private content
documents.api -> cases.records: Metadata references
cases.records -> cases.automation: Asynchronous record changes
cases.automation -> m365.collaboration: Selected internal data
cases.automation -> m365.email: Notification content
cases.automation -> public.copies: Approved publication only`
 },{
 id:'deployment',type:'Physical deployment architecture',title:'Physical deployment architecture',question:'Where are the resources and solution artefacts deployed?',
 purpose:'Place solution artefacts in pre-provisioned Azure, Microsoft 365, customer-identity and Power Platform boundaries. Deployment arrows show placement, not runtime calls.',
 leavesOut:'Provisioning, runtime request sequences, network topology, migration and production deployment credentials. A delivery pipeline and runbook steps are illustrative.',
 plant:String.raw`title Physical deployment architecture - fictional service
artifact "Version-controlled source\nFictional project repository" as Source
artifact "Azure build output\nWeb assets and function package" as AzurePackage
artifact "Managed Power Platform solution\nApp, tables and flows" as Solution
Source ..> AzurePackage : build and review
Source ..> Solution : package and review
node "Pre-provisioned Azure subscription" as Azure {
 node "Public delivery resources" {
  component "Front Door and WAF\nConfigured delivery resource" as Edge
  component "Static Web App\nPublic information site" as Site
 }
 node "Document-processing resources" {
  component "Function App\nDocument service" as Documents
  database "Azure Storage\nPrivate submission container" as PrivateDocs
  database "Azure Storage\nApproved publication container" as PublicDocs
 }
}
node "Pre-provisioned Microsoft tenant" as Microsoft {
 node "Pre-provisioned Power Platform environment" as Platform {
  component "Power Pages site" as Portal
  component "Model-driven app" as Workspace
  database "Dataverse tables" as Records
  component "Power Automate flows" as Automation
 }
 node "Microsoft 365 services" {
  component "Exchange Online" as Email
  component "SharePoint" as SharePoint
 }
}
node "Pre-provisioned customer identity tenant" as Identity {
 component "Existing Azure B2C\nApplication registration and policies" as B2C
}
AzurePackage ..> Site : deploy web assets
AzurePackage ..> Documents : deploy function package
Solution ..> Platform : import managed solution
note bottom
All subscriptions, tenants and environments already exist.
Delivery uses reviewed automation and documented configuration steps.
Existing B2C is a scenario assumption, not a recommendation for a new tenant.
Arrows show artefact placement only; runtime interactions are omitted.
end note`,
 platform:'d2',alt:`direction: down
delivery: Reviewed delivery artefacts {
 source: Version-controlled source
 azure: Azure web and function build output
 solution: Managed Power Platform solution
}
azure: Pre-provisioned Azure subscription {
 public: Public delivery resources {
  edge: Front Door and WAF configuration
  site: Static Web App - public information site
 }
 documents: Document-processing resources {
  api: Function App - document service
  private: Storage - private submission container
  published: Storage - approved publication container
 }
}
microsoft: Pre-provisioned Microsoft tenant {
 platform: Pre-provisioned Power Platform environment {
  portal: Power Pages site
  app: Model-driven app
  records: Dataverse tables
  flows: Power Automate flows
 }
 services: Microsoft 365 services {
  email: Exchange Online
  collaboration: SharePoint
 }
}
identity: Pre-provisioned customer identity tenant {
 b2c: Existing Azure B2C application registration and policies
}
delivery.source -> delivery.azure: Build and review
delivery.source -> delivery.solution: Package and review
delivery.azure -> azure.public.site: Deploy web assets
delivery.azure -> azure.documents.api: Deploy function package
delivery.solution -> microsoft.platform: Import managed solution`
 }];
 return views.flatMap(v=>['plantuml',v.platform].map(platform=>e(`solution-${v.id}-${platform}`,platform,v.type,v.title+(platform==='plantuml'?'':' — alternative view'),v.purpose,platform==='plantuml'?uml(common+v.plant):v.alt,{scenario,level:'Intermediate',question:v.question,leavesOut:v.leavesOut})));
}
