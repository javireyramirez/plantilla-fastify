import { z } from 'zod';

const passwordValidation = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/\d/, 'Debe incluir al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un símbolo (p.ej. !@#$%^&*)')
  .regex(/^\S+$/, 'No debe contener espacios')
  .trim();

const emailValidation = z.string().email('Email inválido').trim();

export const AuthBaseSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
});

export const SignInSchema = AuthBaseSchema.extend({
  rememberMe: z.boolean().default(false),
});

export const SignUpSchema = AuthBaseSchema.extend({
  name: z.string().min(1, 'Se requiere nombre').trim(),
  confirmPassword: z.string().trim(),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      path: ['confirmPassword'],
      code: 'custom',
      message: 'Las contraseñas no coinciden',
    });
  }
});

export const ForgotPasswordSchema = AuthBaseSchema.pick({ email: true });

export const ResetPasswordSchema = z
  .object({
    newPassword: passwordValidation,
    confirmPassword: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'Las contraseñas no coinciden',
      });
    }
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: passwordValidation,
    confirmPassword: z.string().trim(),
    revokeOtherSessions: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'Las contraseñas no coinciden',
      });
    }
  });

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1, 'Se requiere nombre').trim().optional(),
    email: emailValidation.optional(),
    password: passwordValidation.optional(),
    confirmPassword: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password) {
      if (!data.confirmPassword) {
        ctx.addIssue({
          path: ['confirmPassword'],
          code: 'custom',
          message: 'Debes confirmar la contraseña',
        });
      } else if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          path: ['confirmPassword'],
          code: 'custom',
          message: 'Las contraseñas no coinciden',
        });
      }
    }

    if (!data.name && !data.email && !data.password) {
      ctx.addIssue({
        path: ['name'],
        code: 'custom',
        message: 'Debes actualizar al menos un campo',
      });
    }
  });

export type SignInValues = z.input<typeof SignInSchema>;
export type SignUpValues = z.input<typeof SignUpSchema>;
export type ForgotPasswordValues = z.input<typeof ForgotPasswordSchema>;
export type ResetPasswordSchemaValues = z.input<typeof ResetPasswordSchema>;
export type ChangePasswordSchemaValues = z.input<typeof ChangePasswordSchema>;
export type UpdateUserSchemaValues = z.input<typeof UpdateUserSchema>;
