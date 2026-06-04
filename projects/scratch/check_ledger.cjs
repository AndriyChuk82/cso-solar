const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    // 1. Find the project starting with ff0c13ac
    const { data: projects, error: pErr } = await supabase
      .from('projects')
      .select('*')
      .ilike('id', 'ff0c13ac%');
      
    if (pErr) throw pErr;
    console.log('Projects matching ff0c13ac:', projects);
    
    if (projects.length === 0) {
      console.log('No project found matching ff0c13ac');
      return;
    }
    
    const projectId = projects[0].id;
    console.log('Project ID:', projectId);
    
    // 2. Fetch ledger entries for this project
    const { data: ledger, error: lErr } = await supabase
      .from('project_materials_ledger')
      .select('*')
      .eq('project_id', projectId);
      
    if (lErr) throw lErr;
    console.log('Ledger entries found:', ledger.length);
    if (ledger.length > 0) {
      console.log('Sample entry:', ledger[0]);
      console.log('All entries statuses/notes:', ledger.map(l => ({ status: l.status, note: l.note })));
    }
    
    // 3. Fetch proposals from Google Sheets
    const gasUrl = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'getProposals' })
    });
    const propRes = await response.json();
    console.log('Google Sheets proposals response success:', propRes.success);
    if (propRes.success) {
      console.log('Proposals count:', propRes.proposals ? propRes.proposals.length : 0);
      const proposal = propRes.proposals.find(p => p.id === projects[0].proposal_id);
      console.log('Current linked proposal:', proposal ? { id: proposal.id, itemsCount: proposal.items ? proposal.items.length : 0 } : 'None');
      if (proposal && proposal.items) {
        console.log('Proposal items:', proposal.items);
      }
    }
  } catch (err) {
    console.error('Error in check script:', err);
  }
}

check();
