export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/generate') {
      return new Response(JSON.stringify({ error: 'Not found. POST to /generate.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    try {
      const { prompt } = await request.json();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
    // Debug fields (uncomment if troubleshooting API responses):
      // _debug: { status: response.status, stop_reason: data.stop_reason,
      //   error: data.error, content_length: (data.content||[]).length, usage: data.usage }
      return new Response(JSON.stringify({ 
        text: (data.content || []).map(b => b.text || '').join(''),
      }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
  }
};
