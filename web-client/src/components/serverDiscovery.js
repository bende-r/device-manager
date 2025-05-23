import dgram from "dgram";

export const discoverServer = (broadcastPort = 5000) => {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket("udp4");

    client.on("message", (msg) => {
      try {
        const serverInfo = JSON.parse(msg.toString());
        if (serverInfo.type === "server_info") {
          client.close();
          resolve(serverInfo);
        }
      } catch (error) {
        console.error("Error parsing server info:", error);
        client.close();
        reject(error);
      }
    });

    client.on("error", (err) => {
      console.error("UDP error:", err);
      client.close();
      reject(err);
    });

    client.bind(broadcastPort, () => {});
  });
};
