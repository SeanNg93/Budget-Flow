// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  const data = new FormData();

  data.append("client_id", process.env.GITHUB_CLIENT_ID);
  data.append("client_secret", process.env.GITHUB_CLIENT_SECRET);
  data.append("code", req.query.code);
  fetch(`https://github.com/login/oauth/access_token`, {
    method: "POST",
    body: data,

    // mode: "no-cors",
  })
    .then((response) => {
      console.log("response", response);
      return response.text();
    })
    .then((paramsString) => {
      console.log("paramsString", paramsString);
      let params = new URLSearchParams(paramsString);
      console.log("access_token", params.get("access_token"));
      res.status(200).json({ access_token: params.get("access_token") });
    })
    .catch((error) => {
      console.error("Error fetching access token:", error);
    });
    // todo doi ten api 
    // cho client_id va client_secret vao env
}
