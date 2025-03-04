#!/bin/bash

servers=(
    "rb1	1100500	1101000	20241130-1"
    "rb3	1101000	1101500	20241130-2"
    "rb4	1101500	1102000	20241130-3"
    "rb5	1102000	1102500	20241130-4"
    "rb6	1102500	1103000	20241130-5"
    "rb7	1103000	1103500	20241130-6"
    "rb8	1103500	1104000	20241130-7"
    "rb9	1104000	1104500	20241130-8"
    "rb10	1104500	1105000	20241130-9"
)

# File content template with placeholders for dynamic values
file_content_template="rm -rf storage/datasets/default/
rm -rf storage/key_value_stores/default/
rm -rf storage/request_queues/default/

time while true; do AWS_PROFILE=personal CRAWLEE_PURGE_ON_START=0 CRAWLEE_MEMORY_MBYTES=50000 RUN_NAME={{RUN_NAME}} RUN_INTERVAL_FROM={{RUN_INTERVAL_FROM}} RUN_INTERVAL_TO={{RUN_INTERVAL_TO}} CHOP_PAGE_TO=1000 node index.js 2>&1 | tee -a log.txt; sleep 10; done
"

for server_info in "${servers[@]}"; do
    # Parse the server information
    set -- $server_info
    server=$1
    FROM=$2
    TO=$3
    RUN_NAME=$4

    # Replace placeholders in the file content template with server-specific values
    file_content="${file_content_template//\{\{RUN_NAME\}\}/$RUN_NAME}"
    file_content="${file_content//\{\{RUN_INTERVAL_FROM\}\}/$FROM}"
    file_content="${file_content//\{\{RUN_INTERVAL_TO\}\}/$TO}"

    # Use SSH to connect to the server and write the file content to the specified location
    ssh root@"$server" "cd /root/Crawler && git checkout bin/run_long_crawl && git pull origin main"
    ssh root@"$server" "echo \"$file_content\" > /root/Crawler/bin/run_long_crawl && chmod +x /root/Crawler/bin/run_long_crawl"

    # Display status
    if [ $? -eq 0 ]; then
        echo "Successfully updated run_long_crawl on $server"
    else
        echo "Failed to update run_long_crawl on $server"
    fi
done