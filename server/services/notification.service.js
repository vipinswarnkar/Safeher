export const sendSOSNotification = async ({
  contacts,
  user,
  location,
  journey,
}) => {
  console.log("=================================");
  console.log("🚨 SOS NOTIFICATION");
  console.log("User:", user.name);
  console.log("Location:", location.mapUrl);
  console.log("Journey:", journey.source, "->", journey.destination);

  contacts.forEach((contact) => {
    console.log(
      `Notification sent to ${contact.name} (${contact.phone})`
    );
  });

  console.log("=================================");
};