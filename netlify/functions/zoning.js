/*
  This is the Netlify Serverless Function.
  Place this file in your project at: netlify/functions/zoning.js
*/

exports.handler = async function(event, context) {
  // 1. Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Netlify passes the body as a string, so we must parse it
    const body = JSON.parse(event.body);
    const { address, county } = body;

    // 2. Your specific ActionForge Tool ID 
    const ACTIONFORGE_TOOL_ID = "YOUR_TOOL_ID_HERE"; 
    
    // 3. Your ActionForge Proxy URL
    const ACTIONFORGE_URL = `https://api.actionforge.com/api/invoke/${ACTIONFORGE_TOOL_ID}`;

    // 4. Send the request to ActionForge securely
    const actionForgeResponse = await fetch(ACTIONFORGE_URL, {
      method: "POST",
      headers: {
        // Pulls your secret key from your Netlify dashboard settings
        "Authorization": `Bearer ${process.env.ACTIONFORGE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        address: address,
        county: county
      })
    });

    // 5. Handle ActionForge errors
    if (!actionForgeResponse.ok) {
      const errorText = await actionForgeResponse.text();
      return {
        statusCode: actionForgeResponse.status,
        body: JSON.stringify({ 
          error: `ActionForge Error: ${actionForgeResponse.status}`, 
          details: errorText 
        })
      };
    }

    const data = await actionForgeResponse.json();

    // 6. Send the validated output schema back to your frontend website
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Proxy Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
}
