import { NonRetriableError } from "inngest";
import User from "../../models/user.js";
import { sendMail } from "../../utils/mailer.js";
import { inngest } from "../client.js";

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },
  async ({ event, step }) => {
    const { email } = event.data;

    const user = await step.run("get-user", async () => {
      const existingUser = await User.findOne({ email }).select("email").lean();
      if (!existingUser) {
        throw new NonRetriableError("User no longer exists");
      }
      return existingUser;
    });

    await step.run("send-welcome-email", async () =>
      sendMail(
        user.email,
        "Welcome to Ticket AI",
        "Thanks for signing up. We're glad to have you onboard!"
      )
    );

    return { success: true };
  }
);

