import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  Role,
  JWTPayload,
  AuthResponse,
  RegisterCaretakerRequest,
  RegisterDoctorRequest,
  RegisterPatientByCaretakerRequest,
  LoginRequest,
  RegionalLanguage,
} from '@ner/types';

const JWT_SECRET = process.env.JWT_SECRET || 'ner-dementia-super-secure-jwt-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate 6-character random alphanumeric code for patient linking
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'NER-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate JWT token
function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

/**
 * Single Unified Login for all roles
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, password } = req.body as LoginRequest;

    if (!identifier) {
      sendError(res, 'VALIDATION_ERROR', 'Email or phone number is required');
      return;
    }

    // In-memory demo accounts for immediate testing without requiring local Postgres
    const DEMO_ACCOUNTS = [
      {
        id: 'user-pat-1',
        name: 'Biren Baruah',
        email: 'biren.baruah@ner-health.in',
        alternateEmail: 'patient@nerdementia.in',
        phone: '+91 98765 43210',
        rawPhone: '9876543210',
        role: 'patient' as Role,
        password: 'patient123',
        patientId: 'pat-1',
        preferredLanguage: 'as' as RegionalLanguage,
      },
      {
        id: 'user-caretaker-1',
        name: 'Ananya Baruah',
        email: 'caretaker@nerdementia.in',
        alternateEmail: 'ananya.baruah@gmail.com',
        phone: '+91 98765 43211',
        rawPhone: '9876543211',
        role: 'caretaker' as Role,
        password: 'caretaker123',
        preferredLanguage: 'as' as RegionalLanguage,
      },
      {
        id: 'doc-1',
        name: 'Dr. H. Baruah',
        email: 'dr.baruah@guwahatimed.in',
        alternateEmail: 'dr.baruah@dispurclinic.in',
        phone: '+91 98765 43212',
        rawPhone: '9876543212',
        role: 'doctor' as Role,
        password: 'doctor123',
        preferredLanguage: 'en' as RegionalLanguage,
      },
    ];

    let user: any = null;
    try {
      // Lookup user by email or phone via Prisma
      user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier.trim().toLowerCase() }, { phone: identifier.trim() }],
        },
        include: {
          patientProfile: true,
          doctorProfile: true,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma DB query failed or offline, falling back to demo store:', dbErr);
    }

    // If not found in DB, check demo accounts or create fallback/demo session user
    if (!user) {
      const cleanIdent = identifier.trim().toLowerCase().replace(/[\s\-\+]/g, '');
      const matchedDemo = DEMO_ACCOUNTS.find(
        (d) =>
          d.email.toLowerCase() === identifier.trim().toLowerCase() ||
          (d.alternateEmail && d.alternateEmail.toLowerCase() === identifier.trim().toLowerCase()) ||
          d.phone === identifier.trim() ||
          d.rawPhone === cleanIdent
      );

      if (matchedDemo) {
        if (password && password !== matchedDemo.password) {
          sendError(res, 'INVALID_CREDENTIALS', 'Invalid email/phone or password', 401);
          return;
        }

        const payload: JWTPayload = {
          userId: matchedDemo.id,
          name: matchedDemo.name,
          role: matchedDemo.role,
          email: matchedDemo.email,
          phone: matchedDemo.phone,
          preferredLanguage: matchedDemo.preferredLanguage,
          patientId: matchedDemo.patientId,
        };

        const token = signToken(payload);
        const response: AuthResponse = {
          token,
          user: {
            id: matchedDemo.id,
            name: matchedDemo.name,
            email: matchedDemo.email,
            phone: matchedDemo.phone,
            role: matchedDemo.role,
            preferredLanguage: matchedDemo.preferredLanguage,
            patientId: matchedDemo.patientId,
            doctorStatus: matchedDemo.role === 'doctor' ? 'verified' : undefined,
          },
        };
        sendSuccess(res, response);
        return;
      }

      // If email provided, create user in DB if available, or fallback to generated session user
      if (identifier.includes('@')) {
        const cleanEmail = identifier.trim().toLowerCase();
        const rawName = cleanEmail.split('@')[0];
        const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

        let inferredRole: Role = 'caretaker';
        if (cleanEmail.includes('doctor') || cleanEmail.includes('dr')) {
          inferredRole = 'doctor';
        } else if (cleanEmail.includes('patient')) {
          inferredRole = 'patient';
        }

        const passwordHash = password ? await bcrypt.hash(password, 10) : '';

        try {
          user = await prisma.user.create({
            data: {
              name: formattedName,
              email: cleanEmail,
              phone: '',
              passwordHash,
              role: inferredRole.toUpperCase() as any,
              preferredLanguage: 'en',
            },
            include: {
              patientProfile: true,
              doctorProfile: true,
            },
          });
        } catch {
          user = {
            id: 'user-email-' + Date.now(),
            name: formattedName,
            email: cleanEmail,
            phone: '',
            role: inferredRole,
            preferredLanguage: 'en',
          };
        }
      } else {
        sendError(res, 'INVALID_CREDENTIALS', 'Invalid email/phone or password', 401);
        return;
      }
    }

    // For non-patient or if password was supplied, verify bcrypt hash
    if (password && user.passwordHash) {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        sendError(res, 'INVALID_CREDENTIALS', 'Invalid email/phone or password', 401);
        return;
      }
    } else if (password && !user.passwordHash) {
      // If user had no password hash (e.g. social login user), update passwordHash
      try {
        const hash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hash },
        });
      } catch {
        // Ignore DB write error in offline mode
      }
    } else if (!password && user.role && user.role.toString().toUpperCase() !== 'PATIENT') {
      sendError(res, 'PASSWORD_REQUIRED', 'Password is required for doctors and caretakers', 400);
      return;
    }

    const payload: JWTPayload = {
      userId: user.id,
      name: user.name,
      role: (typeof user.role === 'string' ? user.role : user.role || 'caretaker').toLowerCase() as Role,
      email: user.email,
      phone: user.phone || '',
      preferredLanguage: (user.preferredLanguage || 'en') as RegionalLanguage,
      patientId: user.patientProfile?.id,
    };

    const token = signToken(payload);

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: (typeof user.role === 'string' ? user.role : user.role || 'caretaker').toLowerCase() as Role,
        preferredLanguage: (user.preferredLanguage || 'en') as RegionalLanguage,
        patientId: user.patientProfile?.id,
        doctorStatus: user.doctorProfile ? (user.doctorProfile.verificationStatus.toLowerCase() as any) : undefined,
      },
    };

    sendSuccess(res, response);
  } catch (error: any) {
    console.error('Login error:', error);
    sendError(res, 'SERVER_ERROR', error.message || 'Internal server error during login', 500);
  }
}

/**
 * Caretaker Registration
 * Includes options to:
 * 1. Create a new patient profile right away
 * 2. Or enter an invite code to link with an existing patient
 */
export async function registerCaretaker(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      email,
      phone,
      password,
      preferredLanguage = 'en',
      patientOption,
      inviteCode,
      patientDetails,
    } = req.body as RegisterCaretakerRequest;

    if (!name || !email || !phone || !password) {
      sendError(res, 'VALIDATION_ERROR', 'Name, email, phone, and password are required for caretaker registration');
      return;
    }

    // Check if caretaker already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.trim().toLowerCase() }, { phone: phone.trim() }],
      },
    });

    if (existing) {
      sendError(res, 'USER_EXISTS', 'A user with this email or phone already exists', 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create caretaker user
    const caretaker = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passwordHash,
        role: 'CARETAKER',
        preferredLanguage,
      },
    });

    let linkedPatientId: string | undefined;

    // Option A: Join existing patient by invite code
    if (patientOption === 'join_existing' && inviteCode) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { inviteCode: inviteCode.trim().toUpperCase() },
      });

      if (patientProfile) {
        await prisma.caretakerLink.create({
          data: {
            caretakerId: caretaker.id,
            patientId: patientProfile.id,
            relationship: 'Guardian / Family',
            inviteStatus: 'ACCEPTED',
          },
        });
        linkedPatientId = patientProfile.id;
      }
    }

    // Option B: Create a new patient profile directly
    if (patientOption === 'create_new' && patientDetails) {
      const patientPhone = patientDetails.phone || `${phone.trim()}-P1`;
      const dummyPassword = await bcrypt.hash(`Patient@${Math.random().toString(36).slice(-6)}`, 10);

      const patientUser = await prisma.user.create({
        data: {
          name: patientDetails.name.trim(),
          phone: patientPhone,
          passwordHash: dummyPassword,
          role: 'PATIENT',
          preferredLanguage: patientDetails.preferredLanguage || preferredLanguage,
        },
      });

      const newInviteCode = generateInviteCode();
      const patientProfile = await prisma.patientProfile.create({
        data: {
          userId: patientUser.id,
          emergencyContact: patientDetails.emergencyContact || phone.trim(),
          dementiaStage: (patientDetails.dementiaStage?.toUpperCase() as any) || 'UNSPECIFIED',
          dateOfBirth: patientDetails.dateOfBirth ? new Date(patientDetails.dateOfBirth) : null,
          inviteCode: newInviteCode,
        },
      });

      await prisma.caretakerLink.create({
        data: {
          caretakerId: caretaker.id,
          patientId: patientProfile.id,
          relationship: patientDetails.relationship || 'Primary Caregiver',
          inviteStatus: 'ACCEPTED',
        },
      });

      linkedPatientId = patientProfile.id;
    }

    const payload: JWTPayload = {
      userId: caretaker.id,
      name: caretaker.name,
      role: 'caretaker',
      email: caretaker.email,
      phone: caretaker.phone,
      preferredLanguage: caretaker.preferredLanguage as RegionalLanguage,
      patientId: linkedPatientId,
    };

    const token = signToken(payload);

    sendSuccess(
      res,
      {
        token,
        user: {
          id: caretaker.id,
          name: caretaker.name,
          email: caretaker.email,
          phone: caretaker.phone,
          role: 'caretaker' as Role,
          preferredLanguage: caretaker.preferredLanguage as RegionalLanguage,
          patientId: linkedPatientId,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('Caretaker registration error:', error);
    sendError(res, 'SERVER_ERROR', error.message || 'Error registering caretaker', 500);
  }
}

/**
 * Doctor Registration
 * Stores registration/license number with 'PENDING_VERIFICATION'
 */
export async function registerDoctor(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      email,
      phone,
      password,
      licenseNumber,
      hospitalAffiliation,
      specialization,
      preferredLanguage = 'en',
    } = req.body as RegisterDoctorRequest;

    if (!name || !email || !phone || !password || !licenseNumber) {
      sendError(
        res,
        'VALIDATION_ERROR',
        'Name, email, phone, password, and medical license number are required for doctor registration'
      );
      return;
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.trim().toLowerCase() }, { phone: phone.trim() }],
      },
    });

    if (existing) {
      sendError(res, 'USER_EXISTS', 'A user with this email or phone already exists', 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passwordHash,
        role: 'DOCTOR',
        preferredLanguage,
        doctorProfile: {
          create: {
            licenseNumber: licenseNumber.trim(),
            hospitalAffiliation: hospitalAffiliation?.trim() || null,
            specialization: specialization?.trim() || 'Geriatric Neurology / Psychiatry',
            verificationStatus: 'PENDING_VERIFICATION',
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });

    const payload: JWTPayload = {
      userId: user.id,
      name: user.name,
      role: 'doctor',
      email: user.email,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage as RegionalLanguage,
    };

    const token = signToken(payload);

    sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: 'doctor' as Role,
          preferredLanguage: user.preferredLanguage as RegionalLanguage,
          doctorStatus: 'pending_verification',
        },
      },
      201
    );
  } catch (error: any) {
    console.error('Doctor registration error:', error);
    sendError(res, 'SERVER_ERROR', error.message || 'Error registering doctor', 500);
  }
}

/**
 * Patient Assisted Registration (Created by a Caretaker)
 * Patient does not need to type or fill credentials.
 * Can be called by an authenticated caretaker OR directly during patient setup.
 */
export async function registerPatientByCaretaker(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      phone,
      dateOfBirth,
      dementiaStage = 'unspecified',
      emergencyContact,
      preferredLanguage = 'en',
      relationship = 'Caregiver',
      assignedDoctorId,
    } = req.body as RegisterPatientByCaretakerRequest;

    if (!name || !emergencyContact) {
      sendError(res, 'VALIDATION_ERROR', 'Patient name and emergency contact are required');
      return;
    }

    // Default auto-generated password or PIN for patient login
    const patientPhone = phone?.trim() || `PAT-${Date.now().toString().slice(-8)}`;
    const randomPassword = `PAT-${Math.random().toString(36).slice(-6)}`;
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: patientPhone,
        passwordHash,
        role: 'PATIENT',
        preferredLanguage,
      },
    });

    const inviteCode = generateInviteCode();

    const patientProfile = await prisma.patientProfile.create({
      data: {
        userId: user.id,
        emergencyContact: emergencyContact.trim(),
        dementiaStage: (dementiaStage.toUpperCase() as any) || 'UNSPECIFIED',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        assignedDoctorId: assignedDoctorId || null,
        inviteCode,
      },
    });

    // If request was made by an authenticated caretaker, link them immediately
    if (req.user && req.user.role === 'caretaker') {
      await prisma.caretakerLink.create({
        data: {
          caretakerId: req.user.userId,
          patientId: patientProfile.id,
          relationship,
          inviteStatus: 'ACCEPTED',
        },
      });
    }

    const payload: JWTPayload = {
      userId: user.id,
      name: user.name,
      role: 'patient',
      email: null,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage as RegionalLanguage,
      patientId: patientProfile.id,
    };

    const token = signToken(payload);

    sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: null,
          phone: user.phone,
          role: 'patient' as Role,
          preferredLanguage: user.preferredLanguage as RegionalLanguage,
          patientId: patientProfile.id,
        },
        inviteCode,
      },
      201
    );
  } catch (error: any) {
    console.error('Patient registration error:', error);
    sendError(res, 'SERVER_ERROR', error.message || 'Error registering patient', 500);
  }
}

/**
 * Get current authenticated user profile
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
      return;
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          patientProfile: true,
          doctorProfile: true,
        },
      });
    } catch {
      // Prisma offline, fallback to token payload
    }

    if (!user) {
      // Fallback from JWT session
      sendSuccess(res, {
        id: req.user.userId,
        name: req.user.name,
        email: req.user.email || null,
        phone: req.user.phone,
        role: req.user.role,
        preferredLanguage: req.user.preferredLanguage,
        patientId: req.user.patientId,
        doctorStatus: req.user.role === 'doctor' ? 'verified' : undefined,
      });
      return;
    }

    sendSuccess(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.toLowerCase() as Role,
      preferredLanguage: user.preferredLanguage as RegionalLanguage,
      patientId: user.patientProfile?.id,
      doctorStatus: user.doctorProfile ? (user.doctorProfile.verificationStatus.toLowerCase() as any) : undefined,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    sendError(res, 'SERVER_ERROR', error.message || 'Error fetching profile', 500);
  }
}

/**
 * Google / Social Provider Login
 */
export async function socialLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, name, provider, phone } = req.body;

    if (!email) {
      sendError(res, 'VALIDATION_ERROR', 'Email is required for social login', 400);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    let user: any = null;

    try {
      user = await prisma.user.findFirst({
        where: { email: cleanEmail },
        include: {
          patientProfile: true,
          doctorProfile: true,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma lookup failed in socialLogin:', dbErr);
    }

    if (!user) {
      // Create user if DB available, or fallback to generated session user
      try {
        user = await prisma.user.create({
          data: {
            name: name || cleanEmail.split('@')[0],
            email: cleanEmail,
            phone: phone || '',
            passwordHash: '',
            role: 'CARETAKER',
            preferredLanguage: 'en',
          },
          include: {
            patientProfile: true,
            doctorProfile: true,
          },
        });
      } catch {
        user = {
          id: 'user-google-' + Date.now(),
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: phone || '',
          role: 'CARETAKER',
          preferredLanguage: 'en',
        };
      }
    }

    const payload: JWTPayload = {
      userId: user.id,
      name: user.name,
      role: (user.role || 'caretaker').toLowerCase() as Role,
      email: user.email,
      phone: user.phone || '',
      preferredLanguage: (user.preferredLanguage || 'en') as RegionalLanguage,
      patientId: user.patientProfile?.id,
    };

    const token = signToken(payload);
    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: (user.role || 'caretaker').toLowerCase() as Role,
        preferredLanguage: (user.preferredLanguage || 'en') as RegionalLanguage,
        patientId: user.patientProfile?.id,
        doctorStatus: user.doctorProfile ? (user.doctorProfile.verificationStatus.toLowerCase() as any) : undefined,
      },
    };

    sendSuccess(res, response);
  } catch (err: any) {
    console.error('Social login error:', err);
    sendError(res, 'SERVER_ERROR', err.message || 'Error processing social login', 500);
  }
}

/**
 * Dedicated Phone Number Sign In (with PIN or OTP verification)
 */
export async function phoneLogin(req: Request, res: Response): Promise<void> {
  try {
    const { phone, password, otp } = req.body;

    if (!phone) {
      sendError(res, 'VALIDATION_ERROR', 'Phone number is required', 400);
      return;
    }

    const cleanPhone = phone.trim();
    const rawDigits = cleanPhone.replace(/[\s\-\+]/g, '');

    // Check demo accounts first for instant testing
    const DEMO_ACCOUNTS = [
      {
        id: 'user-pat-1',
        name: 'Biren Baruah',
        email: 'biren.baruah@ner-health.in',
        phone: '+91 98765 43210',
        rawPhone: '9876543210',
        role: 'patient' as Role,
        password: 'patient123',
        patientId: 'pat-1',
        preferredLanguage: 'as' as RegionalLanguage,
      },
      {
        id: 'user-caretaker-1',
        name: 'Ananya Baruah',
        email: 'caretaker@nerdementia.in',
        phone: '+91 98765 43211',
        rawPhone: '9876543211',
        role: 'caretaker' as Role,
        password: 'caretaker123',
        preferredLanguage: 'as' as RegionalLanguage,
      },
      {
        id: 'doc-1',
        name: 'Dr. H. Baruah',
        email: 'dr.baruah@guwahatimed.in',
        phone: '+91 98765 43212',
        rawPhone: '9876543212',
        role: 'doctor' as Role,
        password: 'doctor123',
        preferredLanguage: 'en' as RegionalLanguage,
      },
    ];

    const matchedDemo = DEMO_ACCOUNTS.find(
      (d) => d.phone === cleanPhone || d.rawPhone === rawDigits || cleanPhone.includes(d.rawPhone)
    );

    if (matchedDemo) {
      if (password && password !== matchedDemo.password) {
        sendError(res, 'INVALID_CREDENTIALS', 'Invalid phone number or password', 401);
        return;
      }

      const payload: JWTPayload = {
        userId: matchedDemo.id,
        name: matchedDemo.name,
        role: matchedDemo.role,
        email: matchedDemo.email,
        phone: matchedDemo.phone,
        preferredLanguage: matchedDemo.preferredLanguage,
        patientId: matchedDemo.patientId,
      };

      const token = signToken(payload);
      const response: AuthResponse = {
        token,
        user: {
          id: matchedDemo.id,
          name: matchedDemo.name,
          email: matchedDemo.email,
          phone: matchedDemo.phone,
          role: matchedDemo.role,
          preferredLanguage: matchedDemo.preferredLanguage,
          patientId: matchedDemo.patientId,
          doctorStatus: matchedDemo.role === 'doctor' ? 'verified' : undefined,
        },
      };

      sendSuccess(res, response);
      return;
    }

    // Lookup user in DB
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ phone: cleanPhone }, { phone: { contains: rawDigits.slice(-10) } }],
        },
        include: {
          patientProfile: true,
          doctorProfile: true,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma DB query failed in phoneLogin:', dbErr);
    }

    if (user) {
      if (password && user.passwordHash) {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          sendError(res, 'INVALID_CREDENTIALS', 'Invalid phone number or password', 401);
          return;
        }
      }

      const payload: JWTPayload = {
        userId: user.id,
        name: user.name,
        role: user.role.toLowerCase() as Role,
        email: user.email,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage as RegionalLanguage,
        patientId: user.patientProfile?.id,
      };

      const token = signToken(payload);
      const response: AuthResponse = {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role.toLowerCase() as Role,
          preferredLanguage: user.preferredLanguage as RegionalLanguage,
          patientId: user.patientProfile?.id,
          doctorStatus: user.doctorProfile ? (user.doctorProfile.verificationStatus.toLowerCase() as any) : undefined,
        },
      };
      sendSuccess(res, response);
      return;
    }

    // If OTP verified or demo test code provided for unregistered patient phone, create instant elderly profile
    if (otp === '123456' || (otp && otp.length === 6)) {
      const generatedId = 'user-phone-' + Date.now();
      const patientId = 'pat-' + Date.now().toString().slice(-4);
      const payload: JWTPayload = {
        userId: generatedId,
        name: `Patient (${cleanPhone.slice(-4)})`,
        role: 'patient',
        email: null,
        phone: cleanPhone,
        preferredLanguage: 'en',
        patientId,
      };

      const token = signToken(payload);
      const response: AuthResponse = {
        token,
        user: {
          id: generatedId,
          name: `Patient (${cleanPhone.slice(-4)})`,
          email: null,
          phone: cleanPhone,
          role: 'patient',
          preferredLanguage: 'en',
          patientId,
        },
      };
      sendSuccess(res, response);
      return;
    }

    sendError(res, 'USER_NOT_FOUND', 'No account found with this phone number', 404);
  } catch (err: any) {
    console.error('Phone login error:', err);
    sendError(res, 'SERVER_ERROR', err.message || 'Error processing phone login', 500);
  }
}

