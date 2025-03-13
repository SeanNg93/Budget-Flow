import { useEffect } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

export default function OAuth2RedirectHandler() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (code) {
      fetch(`/api/gh_access_token?code=${code}`, { method: "POST" })
        .then((response) => response.json())
        .then((response) => {
          if (response.access_token) {
            Cookies.set("access_token", response.access_token);
            router.push("/dashboard");
          } else {
            console.error("Failed to obtain access token:", response.error);
          }
        })
        .catch((error) => {
          console.error("Error during token exchange:", error);
        });
    }
  }, [code]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "1.875rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          Đang xử lý đăng nhập...
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Vui lòng đợi trong giây lát.
        </p>
      </div>
    </div>
  );
}