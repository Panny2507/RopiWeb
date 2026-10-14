import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * EF-3: Training creation validation middleware
 * Date must be in the future, all required fields present -> HTTP 400 if invalid
 */
export function validateTraining(req: Request, res: Response, next: NextFunction) {
  const { title, location, address, date, startTime, endTime, maxParticipants, type } = req.body;

  const missingFields: string[] = [];
  if (!title || typeof title !== 'string' || !title.trim()) missingFields.push('title (cím)');
  if (!location || typeof location !== 'string' || !location.trim()) missingFields.push('location (helyszín)');
  if (!address || typeof address !== 'string' || !address.trim()) missingFields.push('address (cím/épület)');
  if (!date) missingFields.push('date (dátum)');
  if (!startTime || typeof startTime !== 'string' || !startTime.trim()) missingFields.push('startTime (kezdési idő)');
  if (!endTime || typeof endTime !== 'string' || !endTime.trim()) missingFields.push('endTime (befejezési idő)');
  if (maxParticipants === undefined || maxParticipants === null) missingFields.push('maxParticipants (maximális létszám)');
  if (!type || typeof type !== 'string' || !type.trim()) missingFields.push('type (típus)');

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Hiányzó kötelező mezők: ${missingFields.join(', ')}`,
    });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      error: 'Érvénytelen dátum formátum',
    });
  }

  // Check if date is in the future
  if (parsedDate.getTime() <= Date.now()) {
    return res.status(400).json({
      error: 'Az edzés dátumának a jövőben kell lennie',
    });
  }

  const parsedMax = Number(maxParticipants);
  if (!Number.isInteger(parsedMax) || parsedMax <= 0) {
    return res.status(400).json({
      error: 'A maximális létszámnak pozitív egész számnak kell lennie',
    });
  }

  next();
}

/**
 * Message validation middleware
 * senderEmail format, non-empty senderName, subject, body
 */
export function validateMessage(req: Request, res: Response, next: NextFunction) {
  const { senderName, senderEmail, subject, body } = req.body;

  if (!senderName || typeof senderName !== 'string' || !senderName.trim()) {
    return res.status(400).json({ error: 'A feladó nevének megadása kötelező' });
  }

  if (!senderEmail || !isValidEmail(senderEmail)) {
    return res.status(400).json({ error: 'Érvényes email cím megadása kötelező' });
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return res.status(400).json({ error: 'A tárgy megadása kötelező' });
  }

  if (!body || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ error: 'Az üzenet szövegének megadása kötelező' });
  }

  next();
}

/**
 * Cup Team validation middleware
 */
export function validateCupTeam(req: Request, res: Response, next: NextFunction) {
  const { teamName, captainName, captainEmail, memberCount, category, cupEdition, acceptedRules } = req.body;

  if (!teamName || typeof teamName !== 'string' || !teamName.trim()) {
    return res.status(400).json({ error: 'A csapatnév megadása kötelező' });
  }

  if (!captainName || typeof captainName !== 'string' || !captainName.trim()) {
    return res.status(400).json({ error: 'A csapatkapitány nevének megadása kötelező' });
  }

  if (!captainEmail || !isValidEmail(captainEmail)) {
    return res.status(400).json({ error: 'Érvényes csapatkapitányi email cím megadása kötelező' });
  }

  const count = Number(memberCount);
  if (!Number.isInteger(count) || count < 6) {
    return res.status(400).json({ error: 'A csapat létszámának legalább 6 főnek kell lennie' });
  }

  const validCategories = ['FÉRFI', 'NŐI', 'VEGYES'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ error: `A kategóriának a következők egyikének kell lennie: ${validCategories.join(', ')}` });
  }

  if (!cupEdition || typeof cupEdition !== 'string' || !cupEdition.trim()) {
    return res.status(400).json({ error: 'A kupa kiírás (pl. IV. VRK 2026) megadása kötelező' });
  }

  if (!acceptedRules) {
    return res.status(400).json({ error: 'A versenyszabályzat elfogadása kötelező a nevezéshez' });
  }

  next();
}
