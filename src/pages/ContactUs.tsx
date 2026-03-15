import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

type ContactForm = z.infer<typeof contactSchema>;

const ContactUs = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [sending, setSending] = useState(false);

  const handleChange = (field: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactForm, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactForm;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: "Message sent!", description: "We'll get back to you as soon as possible." });
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar />
      <Navbar />

      {/* Header */}
      <section className="py-16 md:py-20 text-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mb-4">Contact Us</h1>
          <p className="font-body text-base text-muted-foreground max-w-2xl mx-auto">
            Want to stay on top of the latest fashion trends? Contact us for all your fashion needs! Whether you need styling advice or have product inquiries, we're here to help.
          </p>
        </motion.div>
      </section>

      {/* Content Grid */}
      <section className="px-6 md:px-16 pb-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-5 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="md:col-span-2 space-y-8"
          >
            <h2 className="font-heading text-2xl font-light text-foreground">Get in Touch</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-foreground">Email</p>
                  <a href="mailto:info@fashionspectrum.com.au" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
                    info@fashionspectrum.com.au
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-foreground">Phone</p>
                  <a href="tel:+61396999533" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
                    +61 3 9699 9533
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-foreground">Address</p>
                  <p className="font-body text-sm text-muted-foreground">
                    Melbourne, Victoria<br />Australia
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="md:col-span-3"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Input
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <Input
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  className={errors.subject ? "border-destructive" : ""}
                />
                {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject}</p>}
              </div>
              <div>
                <Textarea
                  placeholder="Your Message"
                  rows={6}
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  className={errors.message ? "border-destructive" : ""}
                />
                {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
              </div>
              <Button type="submit" disabled={sending} className="gap-2">
                <Send size={16} />
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
