import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Music } from "lucide-react";

// Force dynamic rendering - this page needs database access
export const dynamic = "force-dynamic";

interface PricingItem {
  name: string;
  price: string;
  description?: string;
}

interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
}

async function getSettings() {
  const settings = await prisma.siteSettings.findFirst();
  return settings;
}

export default async function AboutPage() {
  const settings = await getSettings();

  const pricing = settings?.pricing as PricingItem[] | null;
  const contactInfo = settings?.contactInfo as ContactInfo | null;

  // Check if we have any content to display
  const hasContent =
    settings?.teacherName ||
    settings?.teacherBio ||
    settings?.teacherPhoto ||
    (pricing && pricing.length > 0) ||
    (contactInfo && (contactInfo.email || contactInfo.phone || contactInfo.location));

  if (!hasContent) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6">About</h1>
        <p className="text-muted-foreground">
          Information about the music teacher will be available soon.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Teacher Profile Section */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Photo */}
          {settings?.teacherPhoto && (
            <div className="flex-shrink-0">
              <img
                src={settings.teacherPhoto}
                alt={settings.teacherName || "Music Teacher"}
                className="w-48 h-48 md:w-64 md:h-64 rounded-lg object-cover shadow-lg mx-auto md:mx-0"
              />
            </div>
          )}

          {/* Name and Bio */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Music className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">
                {settings?.teacherName || "Music Teacher"}
              </h1>
            </div>

            {settings?.teacherBio && (
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {settings.teacherBio}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Section */}
        {pricing && pricing.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Lesson Pricing</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pricing.map((item, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <Badge variant="secondary" className="text-lg font-semibold">
                        {item.price}
                      </Badge>
                    </div>
                  </CardHeader>
                  {item.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        {contactInfo && (contactInfo.email || contactInfo.phone || contactInfo.location) && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {contactInfo.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="text-primary hover:underline"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  )}

                  {contactInfo.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="text-primary hover:underline"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  )}

                  {contactInfo.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span>{contactInfo.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
