#!/usr/bin/env python3
"""
Simple CORS proxy server for the OCDS API
Run with: python3 cors_proxy.py
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request
import json
import sys

class CORSProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the request path
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/OCDSReleases':
            self.proxy_ocds_request(parsed_path.query)
        elif parsed_path.path.startswith('/api/OCDSReleases/release/'):
            # Extract OCID from path
            ocid = parsed_path.path.split('/')[-1]
            self.proxy_detail_request(ocid)
        else:
            self.send_error(404, "Not Found")
    
    def proxy_ocds_request(self, query_string):
        try:
            # Build the target URL
            target_url = f"https://ocds-api.etenders.gov.za/api/OCDSReleases?{query_string}"
            
            # Make the request to the actual API
            with urllib.request.urlopen(target_url) as response:
                data = response.read()
                
            # Send CORS headers and response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(data)
            
        except Exception as e:
            print(f"Error proxying request: {e}")
            self.send_error(500, f"Proxy Error: {str(e)}")
    
    def proxy_detail_request(self, ocid):
        try:
            # Build the target URL for detail request
            target_url = f"https://ocds-api.etenders.gov.za/api/OCDSReleases/release/{ocid}"
            
            # Make the request to the actual API
            with urllib.request.urlopen(target_url) as response:
                data = response.read()
                
            # Send CORS headers and response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(data)
            
        except Exception as e:
            print(f"Error proxying detail request: {e}")
            self.send_error(500, f"Proxy Error: {str(e)}")
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom logging
        print(f"[{self.address_string()}] {format % args}")

def run_server(port=8080):
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSProxyHandler)
    print(f"🚀 CORS Proxy Server running on http://localhost:{port}")
    print(f"📡 Proxying requests to: https://ocds-api.etenders.gov.za")
    print("Press Ctrl+C to stop")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Invalid port number, using default 8080")
    
    run_server(port)