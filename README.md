# GitHub Actions CI/CD Dashboard

A web application that listens to GitHub webhooks and displays the status of GitHub Actions workflows in real-time. The app also collects historical data and visualizes it through interactive charts and graphs.

## Project Structure

- **Frontend**: Angular application with visualizations using Highcharts
- **Backend**: Node.js Express server with Octokit for GitHub webhook handling and MongoDB for data storage

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local installation or MongoDB Atlas)
- GitHub account with repositories using GitHub Actions

## Setup and Installation

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your GitHub token and webhook secret:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/github-actions-dashboard
   GITHUB_TOKEN=your_github_token
   WEBHOOK_SECRET=your_webhook_secret
   ALLOWED_ORIGINS=http://localhost:4200
   ```

4. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:4200`

## Setting Up GitHub Webhooks

1. Go to your GitHub repository settings
2. Navigate to Webhooks > Add webhook
3. Set the Payload URL to your server address: `https://your-server-address/webhook`
4. Set Content type to `application/json`
5. Enter your webhook secret (same as in your .env file)
6. Select individual events and check:
   - Workflow runs
   - Workflow jobs
   - Pushes (optional)
7. Click "Add webhook"

## Features

### Backend

- Webhook handling with Octokit for GitHub events
- MongoDB storage of raw webhook payloads and structured workflow data
- REST API for querying workflow data
- Real-time status updates for active workflows

### Frontend

- Live dashboard of active workflow runs
- Historical workflow data visualization
- Detailed workflow run information
- Charts for success/failure metrics
- Workflow duration statistics

## API Endpoints

- `GET /api/workflows` - Get all workflows with optional filtering
- `GET /api/workflows/active` - Get currently active workflows
- `GET /api/workflows/:id` - Get a specific workflow by ID
- `GET /api/workflows/stats/summary` - Get workflow statistics for visualizations

## Development

### MongoDB Schema

The application uses two main collections:

1. **events** - Raw webhook data for debugging and flexibility
2. **workflows** - Structured data for querying and display

### Extending the Dashboard

To add more visualizations:

1. Create a new chart component or extend the existing ones
2. Add appropriate API endpoints in the backend
3. Update the frontend service to fetch the required data

## Troubleshooting

- Ensure MongoDB is running before starting the backend
- Check that your GitHub token has appropriate permissions
- Verify webhook deliveries in the GitHub repository settings
- Look for errors in the browser console or server logs
