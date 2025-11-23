# 🎣 Fishing Serverless Architecture

Pixel-perfect Instagram login clone that sends credentials to a **serverless log collector** on AWS (**API Gateway → Lambda → S3**).

Main goal: show a minimal, production‑style pipeline that accepts a JSON payload from the browser, passes it through API Gateway with **Lambda Proxy Integration**, processes it in a Node.js 22.x Lambda, and stores it as JSON in S3.

![Instagram login clone](img/clone-instagram.png)

The login clone UI was handcrafted by the author as a Full‑Stack engineer to serve as a realistic frontend for this serverless lab.

## Project Structure

```text
hacker/
├── index.html      # Instagram login clone (HTML)
├── styles.css      # Dark theme styles (CSS variables, responsive layout)
├── script.js       # Frontend logic (validation + call to API Gateway)
└── README.md       # Documentation (this file)
```

On the backend side (configured in the AWS console):

- **API Gateway REST API** – public HTTPS endpoint.
- **Lambda function** – Node.js 22, writes logs to S3.
- **S3 bucket** – persistent JSON log storage (e.g. `logs-22321`).

---

## Frontend: Instagram Login Clone

Pure HTML/CSS/JavaScript clone of the Instagram login screen. The real purpose of the page is to generate a JSON payload for the serverless backend, not to authenticate the user.

On **Log in**, the page sends a JSON document to your API Gateway endpoint:

- `stolen_user` – username from the form.
- `stolen_pass` – password from the form.
- `source_url` – current page URL.
- `timestamp` – ISO timestamp generated in the browser.

---

## Backend: Serverless Logging Pipeline

### AWS API Gateway (Lambda Proxy Integration)

- **Type:** REST API (region `eu-central-1`).
- **Resource:** `/log`.
- **Methods:**
  - `POST /log` – main ingestion endpoint, wired to Lambda via **Lambda Proxy Integration**.
  - `OPTIONS /log` – CORS preflight endpoint implemented as a **Mock integration**.

With **Lambda Proxy Integration**, API Gateway forwards the full HTTP request (body, headers, path, method, etc.) to Lambda and receives `statusCode`, `body` and optional `headers` back. In this project, the important HTTP/CORS headers are **centralized in API Gateway** via **Method Response** and **Integration Response** configuration, so Lambda stays focused on business logic.

- `OPTIONS /log` Mock response always returns (configured in Method/Integration Response):
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: OPTIONS,POST`
  - `Access-Control-Allow-Headers: Content-Type,Authorization`
- `POST /log` response headers (including CORS) are also configured in API Gateway, using header mappings in Integration Response.

**Gateway essentials:**

![Create public REST API](img/create-public-api-gateway.png) – new public REST API where the `/log` resource will live.

![Create /log resource](img/create-new-resource-for-gw.png) – creation of the `/log` endpoint under the API (screenshot shows the method creation screen wired to this resource).

![Create POST /log method](img/create-post-method-for-api-gateway.png) – creation of the `POST /log` method that will receive login events.

![Create OPTIONS /log mock method](img/create-new-optios-methods-with-mock.png) – creation of the `OPTIONS /log` Mock method used for CORS preflight.

![General API Gateway configuration overview](img/generall-view-of-gw-api-setup.png) – console view showing the final `/log` setup and its methods around the time of deployment.

![Deploy API to stage](img/deploy-api.png) – dialog for deploying the API configuration to a stage so the endpoint becomes callable.

![Deployed API with invoke URL](img/api-gw-deployed-with-invoke-url.png) – deployed stage details with the final invoke URL that the frontend uses in `script.js`.

**Request/response shaping:**

![Updated mapping template](img/update-mapping-template.png) - final template that passes the raw JSON safely to Lambda.

![Add integration request headers](img/add-intergration-request-header-for-post-also.png) – extra headers forwarded from client to Lambda.

![Add header mapping in integration response](img/add-header-mapping-in-integrary-response.png) – integration response mapping used to expose specific headers.

![Final method response headers for CORS](img/added-methods-responces-headers-result.png) – method response definition that whitelists CORS headers.

![OPTIONS method response CORS headers](img/set-up-options-methods-responce-allow-origin-headers.png) – CORS headers specifically for the `OPTIONS` Mock response.

### AWS Lambda (`LogCollectorFunction`)

- **Name:** `LogCollectorFunction`.
- **Runtime:** **Node.js 22.x**.
- **Module system:** ES Modules (`import` / `export`).

Originally the function used CommonJS (`require`) and crashed with `ReferenceError` / `Runtime.Unknown` on Node.js 22.x. It was migrated to native ES Modules and AWS SDK v3 imports to be compatible with the modern Lambda runtime.

**Lambda setup:**

![Create Lambda function (Node.js)](img/create-aws-lambda-with-nodejs.png) – creation of the `LogCollectorFunction` with Node.js runtime.

![Lambda with final Node.js code](img/lambda-with-node-code-created.png) – final Lambda code with ES Modules and AWS SDK v3 imports.

![POST method integrated with Lambda](img/method-post-created-with-lambda.png) – integration of the `POST /log` method with the Lambda function.

![API Gateway method updated to use the Lambda function](img/update-api-gw-with-lambda-fn.png) – update of the `POST /log` method to use the Lambda function.

### Amazon S3 (`logs-22321`)

- **Bucket:** `logs-22321`.
- **Purpose:** durable, append‑only storage for JSON log files coming from the phishing‑style frontend.

Each object contains the original login payload (username, password, source URL, timestamp, user agent, etc.) plus any extra metadata added by the Lambda.

### IAM: Permissions Model

The Lambda execution role is configured with minimal but sufficient permissions:

- `AWSLambdaBasicExecutionRole` – allows writing execution logs to CloudWatch and performing basic Lambda operations.
- `AmazonS3FullAccess` – allows reading/writing objects in the `logs-22321` bucket (for this educational setup, full access is acceptable; in production you would scope this down to a specific bucket/prefix).

![Attach S3 FullAccess policy to Lambda role](img/attach-new-s3-fullaccess-policy-for-lambda-rol.png) – attachment of the `AmazonS3FullAccess` policy to the Lambda execution role.

![Policy successfully attached to role](img/result-of-success-added-policyđ.png) – confirmation of the policy attachment to the role.

---

## End‑to‑End Request Flow

1. The user opens the Instagram login clone in a browser.
2. The frontend validates the form and enables the login button when input is valid.
3. When the user clicks **Log in**, `script.js` sends `POST /log` with a JSON payload to the API Gateway invoke URL.
4. Before the POST, the browser issues an `OPTIONS /log` preflight request. API Gateway answers from the Mock integration with the configured CORS headers.
5. For the POST request, API Gateway forwards the full HTTP request to `LogCollectorFunction` via **Lambda Proxy Integration`**.
6. Lambda parses `event.body`, enriches the payload, writes it as a JSON object into the `logs-22321` S3 bucket, and returns `statusCode` + JSON `body`.
7. API Gateway applies the configured Method/Integration Response mappings, adds all required headers (including CORS), and returns the final HTTP response to the browser.
8. The frontend can now safely read the JSON response (no CORS errors), and the captured credentials are visible in the UI and in S3.

![UI showing captured credentials](img/result-of-password-stolen-in-ui.png) – example of a stolen credentials payload rendered in the demo UI.

![S3 bucket with stored JSON log files](img/s3-saves-files-with-data.png) – example of a stored log file in the `logs-22321` bucket.

![S3 bucket with stored JSON log files](img/content-of-s3.png) – contents the `logs-22321` bucket file.
