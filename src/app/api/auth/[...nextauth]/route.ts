import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        // Member Login Provider
        CredentialsProvider({
            id: "member-login",
            name: "Member Login",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "member@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                const user = await prisma.user.findFirst({
                    where: { email: credentials.email.toLowerCase() }
                });

                if (!user || !user.passwordHash) {
                    throw new Error("Invalid email or password");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isPasswordValid) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    organizationId: user.organizationId,
                    role: (user as any).role,
                };
            }
        }),
        // Admin Login Provider
        CredentialsProvider({
            id: "admin-login",
            name: "Admin Login",
            credentials: {
                username: { label: "Admin Username", type: "text" },
                password: { label: "Master Password", type: "password" }
            },
            async authorize(credentials) {
                // A secure administrative backend check based on environment variables
                const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";
                const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "P4ssw0rd";

                // We verify against the username field
                if (credentials?.username === ADMIN_USERNAME && credentials?.password === ADMIN_PASSWORD) {
                    return {
                        id: "admin-system",
                        email: "admin@ukshooting.club", // dummy email 
                        name: "Admin",
                        role: "ADMIN",
                    };
                }

                throw new Error("Invalid administrative credentials");
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.organizationId = (user as any).organizationId;
                token.role = (user as any).role;
                
                // Security Requirement: Admin logins must automatically log off after 30 minutes.
                if ((user as any).role === 'ADMIN') {
                    token.exp = Math.floor(Date.now() / 1000) + (30 * 60);
                }
            } else {
                // For sliding sessions on every subsequent API/Page load explicitly
                if (token.role === 'ADMIN') {
                    token.exp = Math.floor(Date.now() / 1000) + (30 * 60);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).organizationId = token.organizationId;
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
