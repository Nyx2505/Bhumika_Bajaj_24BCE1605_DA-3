# CloudWatch Simulator – Interactive AWS Monitoring & Learning Platform

> **College Assignment**: AWS Solutions Architect (DA-3)  
> **AWS Service Simulated**: Amazon CloudWatch  
> **Unique Enhancement**: Interactive CloudWatch Learning Mode (The CloudWatch State Machine Laboratory)

---

## 📌 Executive Summary & Assignment Context

This web application is a full, functional simulator of **Amazon CloudWatch**, built to demonstrate the practical application of AWS monitoring, telemetry ingestion, alarm evaluation, and operational log correlation.

Rather than connecting to a live, paid AWS account with sensitive credentials, this application runs a high-fidelity **local telemetry engine** that simulates multi-resource metrics and alarm evaluations in real time.

---

## 🔄 Core User Flow

The platform makes the canonical AWS CloudWatch monitoring lifecycle visually evident and interactive across the top pipeline navigator:

```
  [ AWS Resources ]
         ↓ (Emits CPU, Memory, Network, DB Connections, Lambda Latency, 5XX Errors)
     [ Metrics ]
         ↓ (Aggregated into time-series data streams across AWS namespaces)
    [ Dashboards ]
         ↓ (Real-time operational charts, KPI stat cards, and resource health status)
 [ Alarm Evaluation ]
         ↓ (Sliding window buffer evaluating M out of N datapoints against thresholds)
   [ Alarm States ]
         ↓ (Dynamic transitions between OK, ALARM, and INSUFFICIENT_DATA + notifications)
      [ Logs ]
           (Correlated log groups, Log Insights query search, and automated incident logs)
```

---

## Unique Enhancement: Interactive CloudWatch Learning Mode

> [!NOTE]
> In accordance with the assignment guidelines, this project avoids common buzzwords like AI recommendations or basic anomaly detection (which AWS natively offers). Instead, our enhancement is an **Educational CloudWatch State Machine Laboratory**.

The Learning Mode provides two specialized pedagogical environments:

### 1. Alarm State Machine Sandbox (Interactive Lab)
- **Multi-Period Configuration**: Set threshold ($T$), comparison operator ($\ge, >, \le, <$), evaluation periods ($N$), and datapoints to alarm ($M$).
- **Sliding Evaluation Window Visualizer**: Visual buffer displaying the exact $N$ datapoints currently being evaluated, with clear color indicators for breaching vs safe periods.
- **Explainability Engine ("Why did this state change?")**: Provides mathematical, plain-English reasoning for every state change:
  - *Example:* `Condition Met (ALARM): 3 out of the last 3 datapoints [88%, 92%, 95%] were greater than or equal to threshold (80%). Required breaches (M=3) satisfied!`
- **Interactive Datapoint Feeder**: Scrub custom values or inject pre-set architectural sequences:
  - *Transient Spike (Cron Job)*: Demonstrates why $M$ of $N$ prevents false alarms.
  - *Sustained Outage Breach*: Triggers true positive alerting.
  - *Auto-Healing Recovery*: Illustrates safe transition back to `OK`.
  - *Flapping Noise*: Demonstrates the danger of alert fatigue.

### 2. Guided CloudWatch Architectural Challenges
- **Challenge 1: Stop the Pager Storm (Eliminate Alarm Flapping)**  
  *AWS Well-Architected Pillar: Operational Excellence* — Reconfigure an alarm to prevent transient 30-second cron spikes from paging on-call engineers.
- **Challenge 2: Catch the Database Connection Pool Leak**  
  *AWS Well-Architected Pillar: Reliability* — Catch creeping RDS connection pool leaks before reaching hard limits.
- **Challenge 3: Safe EC2 Auto Scaling Scale-In Policy**  
  *AWS Well-Architected Pillar: Cost Optimization* — Configure downscaling alarms with safe multi-period cooldowns to avoid compute thrashing.

---

## 🏗️ Simulated AWS Infrastructure Topology

The simulator tracks five distinct resources spanning four core AWS services:
1. **EC2 Web Server (`i-0a812fec99`)**: `CPUUtilization`, `NetworkIn`, `NetworkOut`, `StatusCheckFailed`
2. **EC2 Worker Node (`i-09bc83a152`)**: `CPUUtilization`, `NetworkIn`, `NetworkOut`
3. **RDS PostgreSQL DB (`db-orders-postgres`)**: `CPUUtilization`, `DatabaseConnections`, `FreeableMemory`, `ReadIOPS`
4. **Lambda Function (`order-processing-fn`)**: `Invocations`, `Duration`, `Errors`, `Throttles`
5. **Application Load Balancer (`alb-public-ingress`)**: `RequestCount`, `TargetResponseTime`, `HTTPCode_Target_5XX_Count`

---

## ⚡ Incident & Chaos Injection Drawer

Click the **"Chaos Scenarios"** button in the top navigation to trigger real-world AWS incidents:
- **Flash Crowd**: Surges web traffic, driving EC2 CPU past 90%.
- **DB Connection Exhaustion**: Emulates connection leaks on RDS.
- **Lambda Memory Crash**: Injects recurring execution errors.
- **Restore All**: Returns telemetry to normal operating parameters.

---

## 🛠️ Technology Stack

- **Frontend**: React 18/19, TypeScript, Vite
- **Styling**: Tailwind CSS (AWS Management Console Dark Palette)
- **Icons**: Lucide React
- **Charts**: Recharts (Responsive Area, Line, and Reference Threshold visualizations)
- **Persistence**: Browser `localStorage` for user-created alarms and custom thresholds

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd project

# Install dependencies
npm install --legacy-peer-deps

# Start the Vite development server
npm run dev
```

### Production Build
```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deployment

The application is completely static and can be deployed directly to:
- **Vercel**: Connect the GitHub repository and deploy with default Vite settings.
- **GitHub Pages**: Run `npm run build` and publish the `dist/` directory.
- **AWS S3 + CloudFront**: Upload `dist/` to an S3 bucket configured for static web hosting.
