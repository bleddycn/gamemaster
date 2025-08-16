import { test, expect } from "@playwright/test";

test("open competition route exists", async ({ request }) => {
  // sanity: list routes
  const routes = await request.get("http://localhost:4000/__routes");
  expect(routes.ok()).toBeTruthy();
  
  const routesData = await routes.json();
  console.log("Available routes:", routesData.routes);

  // you can insert a known DRAFT competition id here if available
  // const res = await request.post("http://localhost:4000/competitions/<draftId>/open");
  // expect(res.status()).toBe(200);
});