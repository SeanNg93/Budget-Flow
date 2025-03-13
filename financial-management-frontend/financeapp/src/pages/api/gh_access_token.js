// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async function handler(req, res) {
  const { code } = req.query;

  const params = new URLSearchParams();
  params.append("client_id", process.env.GITHUB_CLIENT_ID);
  params.append("client_secret", process.env.GITHUB_CLIENT_SECRET);
  params.append("code", code);

  try {
    const response = await fetch(`https://github.com/login/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: params,
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    res.status(200).json({ access_token: data.access_token });
  } catch (error) {
    console.error("Error fetching access token:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}