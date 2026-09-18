import type { Copy } from "./types";

/** Engelse copy. Zie content/nl.ts voor waarom twee regels afwijken van het ontwerp. */
export const en: Copy = {
  meta: {
    title: "Static Line",
    description: "Raw, wired rock from Ede. Shows, photos and bookings.",
  },
  nav: {
    shows: "Shows",
    photos: "Photos",
    band: "Band",
    music: "Music",
    video: "Video",
    booking: "Booking",
    menu: "Menu",
    language: "Language",
  },
  hero: {
    kickerFirst: "First show",
    kickerNext: "Next show",
    kickerNone: "No shows scheduled yet",
    sub: "Raw, wired rock from Ede. No detours. Loose strings, blown amps, a set that never sits still.",
    subShort: "Raw rock from Ede. No detours.",
    wordmarkAlt: "Static Line",
    ctaBook: "Book us",
    ctaShows: "All shows",
  },
  nextShow: {
    label: "Next show",
    tickets: "Tickets",
    none: "No shows scheduled",
  },
  shows: {
    heading: "All shows",
    count: { one: "{count} date", other: "{count} dates" },
    viewAll: "Full schedule",
    empty: "Nothing in the calendar yet.",
  },
  status: {
    release: "Release show",
    tickets: "Tickets",
    announced: "Announced",
    soldout: "Sold out",
  },
  photos: {
    heading: "Photos",
    placeholders: [
      "live shot — duotone red",
      "band portrait",
      "crowd — duotone teal",
      "backstage",
      "guitar detail",
    ],
  },
  footer: {
    note: "Static Line · Ede · Booking and tech rider on request",
    mail: "boeking@staticline.nl",
    social: "Follow us",
  },

  agenda: {
    title: "Shows",
    intro:
      "Where we play. Nothing near you? Just ask — that is what the form is for.",
    upcoming: "Upcoming",
    archive: "Played",
    archiveEmpty: "Nothing played yet. That changes on 10 November.",
    map: "On the map",
    mapEmpty: "A map appears here once the shows carry coordinates.",
  },

  band: {
    title: "About the band",
    intro: "",
    members: "Line-up",
    bioEmpty:
      "The band text is still being written. Until then: four of us, guitars too loud, and a weakness for nineties songs that still hurt.",
    membersEmpty: "The line-up is still being filled in.",
    noRole: "Band member",
    more: "More about the band",
  },

  music: {
    title: "Music",
    intro: "What we play.",
    spotify: "Listen",
    setlist: "What we play",
    setlistNote: "This list comes straight from the band's app, so it stays current.",
    empty: "Nothing online yet. Come to a show — that is the point anyway.",
  },

  video: {
    title: "Video",
    intro: "The band on film.",
    empty: "No video yet. As soon as something is filmed, it lands here.",
  },

  gallery: {
    title: "Photos",
    intro: "",
  },

  embed: {
    load: "Load {service}",
    note: "Only loads once you click — otherwise {service} sets cookies for everyone who passes by.",
  },

  confirm: {
    title: "Sign-up confirmed",
    ok: "Done. You are on the list and will get an email whenever a show is added.",
    unknown:
      "This link no longer works. Sign up again and we will send you a new one.",
    noToken: "There is no key in this link. Try copying it from the email again.",
    error: "Something went wrong on our end. Try again in a moment.",
    home: "Go to the site",
  },

  mail: {
    bookingSubject: "We got your message — Static Line",
    bookingGreeting: "Hi {name},",
    bookingBooking:
      "Thanks for your booking request. We have it and will get back to you, usually within a few days.",
    bookingQuestion:
      "Thanks for your message. We have read it and will get back to you, usually within a few days.",
    bookingCopy: "Here is what you sent us:",
    newsletterSubject: "Confirm your sign-up — Static Line",
    newsletterGreeting: "Hi,",
    newsletterBody:
      "Click this link to confirm your newsletter sign-up:",
    newsletterIgnore:
      "Did not sign up? Then do nothing. Without this click we will not send you anything.",
    signature: "Static Line · Ede · staticline.nl",
  },

  newsletter: {
    title: "Stay posted",
    body: "One email when a show is added. No more than that.",
    placeholder: "you@email.com",
    submit: "Sign up",
    ok: "Almost there — click the link in the email we just sent.",
    error: "That did not work. Try again in a moment.",
    consent: "One click to unsubscribe, in every email.",
  },

  booking: {
    title: "Booking",
    intro:
      "Want to book us, or have a question? Fill this in and you will get an answer. The more you tell us, the sooner we can say something useful.",
    kindLabel: "What is this about?",
    kindBooking: "Booking",
    kindQuestion: "General question",
    groupContact: "About you",
    groupWhen: "When",
    groupPlace: "Where",
    groupTech: "Technical and practical",
    groupMessage: "Your message",
    fields: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      date: "Date",
      datePlaceholder: "e.g. 14 March, or somewhere in May",
      location: "Location",
      time: "Time",
      timePlaceholder: "e.g. 21:00",
      duration: "Playing time",
      durationPlaceholder: "e.g. 2 × 45 minutes",
      eventType: "Type of event",
      eventTypePlaceholder: "bar, festival, party, wedding…",
      budget: "Budget",
      budgetPlaceholder: "e.g. 350, or a range",
      roomSize: "Size of the room",
      roomSizePlaceholder: "e.g. 150 people",
      parking: "Parking",
      backstage: "Backstage or secure storage",
      pa: "PA available",
      message: "Message",
      messagePlaceholder: "Anything else we should know.",
    },
    choice: {
      yes: "Yes",
      no: "No",
      unknown: "Not sure",
      rent: "Can be hired",
    },
    submit: "Send",
    sending: "Sending…",
    ok: "Sent.",
    okNote: "You will hear from us, usually within a few days.",
    errorGeneric: "Sending failed. Try again, or email us directly.",
    errorName: "Please enter your name.",
    errorEmail: "Please enter an email address we can reach you on.",
    errorCaptcha: "The check did not pass. Please try again.",
    required: "required",
    optional: "optional",
    riderTitle: "Tech rider and stage plan",
    riderBody:
      "What we bring, what the venue provides, the input list and where we stand. Always the current version, straight from the band's app.",
    riderLink: "View the rider",
    riderEmpty:
      "The rider is not shareable yet. Ask for it and we will send it over.",
  },
};
