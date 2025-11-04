FROM ubuntu:latest

# Install FET and dependencies
RUN apt update && \
    apt install -y fet && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directories
WORKDIR /timetables

# Create output directory
RUN mkdir -p /output

# Default command - keep container running
CMD ["tail", "-f", "/dev/null"]