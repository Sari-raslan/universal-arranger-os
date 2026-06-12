export const UAOS_AGENT_STATUS={version:"1.22-autonomous-dev",deploy:false,modules:["midi-learn","scene-snapshots","lane-router","validators"],safety:{deployBlocked:true,manualDeployOnly:true}};
export function uaosAgentReport(){ return {...UAOS_AGENT_STATUS,generatedAt:new Date().toISOString()}; }
