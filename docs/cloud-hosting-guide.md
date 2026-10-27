# Permanent $0 Cloud Hosting Guide: Oracle Cloud Infrastructure (OCI)

This guide documents how to host Jitsi Meet and Jitsi Dashboard permanently for **$0 forever** using Oracle Cloud's "Always Free" Tier.

---

## 1. Why Oracle Cloud (OCI) "Always Free"?
Unlike traditional cloud platforms (AWS, GCP, Render) where free tiers expire in 12 months, have < 1GB RAM, or block UDP:
- **Compute**: 4 ARM64 (Ampere A1) OCPUs, **24 GB RAM**
- **Storage**: 200 GB NVMe Boot Volume
- **Network**: Static Public IPv4, **10 TB/month free egress**
- **WebRTC Viability**: Full direct ingress for **UDP port 10000** (Jitsi Videobridge).

---

## 2. Step-by-Step Setup

### Step A: Create an OCI Account
1. Sign up at [cloud.oracle.com](https://cloud.oracle.com).
2. Complete identity verification (requires credit card for fraud prevention, but charges $0).

### Step B: Provision an Ampere A1 Instance
1. Go to **Compute** &rarr; **Instances** &rarr; **Create Instance**.
2. Image: **Ubuntu 24.04 LTS (AArch64 / ARM)**.
3. Shape: **VM.Standard.A1.Flex** &rarr; Select 4 OCPUs and 24 GB RAM.
4. Networking: Assign a Public IPv4 address.
5. Paste your SSH Public Key and click **Create**.

### Step C: Open Security List Ports (Virtual Cloud Network)
Under **Networking** &rarr; **Virtual Cloud Networks** &rarr; **Security Lists** &rarr; Add Ingress Rules:
- **TCP 80, 443** (Jitsi Meet Web Interface)
- **TCP 3001** (Jitsi Dashboard, or access via Tailscale)
- **TCP 3000** (Grafana, if running monitoring)
- **UDP 10000** (Jitsi Videobridge media routing — CRITICAL)

### Step D: Deploy with Docker on Ubuntu
Connect via SSH and run:
```bash
# 1. Install Docker & Git
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git

# 2. Clone Jitsi Meet & Dashboard
git clone https://github.com/jitsi/docker-jitsi-meet.git
cd docker-jitsi-meet
cp env.example .env
./gen-passwords.sh

# 3. Configure public IP in .env
# Set PUBLIC_URL=https://<your-oci-ip>
# Set JVB_ADVERTISE_IPS=<your-oci-ip>

# 4. Clone & Run Jitsi Dashboard
git clone https://github.com/higherkey/jitsi-dashboard.git dashboard
cd dashboard
npm install
npm start
```
---

## 3. Remote Management via Tailscale
Install Tailscale on the OCI instance:
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```
Now you can access `http://<oci-tailscale-name>:3001` securely from your phone or PC without opening port 3001 to the public internet!
