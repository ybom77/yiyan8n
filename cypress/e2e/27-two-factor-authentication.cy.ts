import generateOTPToken from 'cypress-otp';
import { INSTANCE_OWNER, INSTANCE_ADMIN, BACKEND_BASE_URL } from '../constants';
import { SigninPage } from '../pages';
import { PersonalSettingsPage } from '../pages/settings-personal';
import { MfaLoginPage } from '../pages/mfa-login';
import { MainSidebar } from './../pages/sidebar/main-sidebar';

const MFA_SECRET = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';

const RECOVERY_CODE = 'd04ea17f-e8b2-4afa-a9aa-57a2c735b30e';

const user = {
	email: INSTANCE_OWNER.email,
	password: INSTANCE_OWNER.password,
	firstName: 'User',
	lastName: 'A',
	mfaEnabled: false,
	mfaSecret: MFA_SECRET,
	mfaRecoveryCodes: [RECOVERY_CODE],
};

const admin = {
	email: INSTANCE_ADMIN.email,
	password: INSTANCE_ADMIN.password,
	firstName: 'Admin',
	lastName: 'B',
	mfaEnabled: false,
	mfaSecret: MFA_SECRET,
	mfaRecoveryCodes: [RECOVERY_CODE],
};

const mfaLoginPage = new MfaLoginPage();
const signinPage = new SigninPage();
const personalSettingsPage = new PersonalSettingsPage();
const mainSidebar = new MainSidebar();

describe('Two-factor authentication', () => {
	beforeEach(() => {
		void Cypress.session.clearAllSavedSessions();
		cy.request('POST', `${BACKEND_BASE_URL}/rest/e2e/reset`, {
			owner: user,
			members: [],
			admin,
		});
		cy.on('uncaught:exception', (error) => {
			expect(error.message).to.include('Not logged in');
			return false;
		});
		cy.intercept('GET', '/rest/mfa/qr').as('getMfaQrCode');
	});

	it('Should be able to login with MFA token', () => {
		const { email, password } = user;
		signinPage.actions.loginWithEmailAndPassword(email, password);
		personalSettingsPage.actions.enableMfa();
		mainSidebar.actions.signout();
		const token = generateOTPToken(user.mfaSecret);
		mfaLoginPage.actions.loginWithMfaToken(email, password, token);
		mainSidebar.actions.signout();
	});

	it('Should be able to login with recovery code', () => {
		const { email, password } = user;
		signinPage.actions.loginWithEmailAndPassword(email, password);
		personalSettingsPage.actions.enableMfa();
		mainSidebar.actions.signout();
		mfaLoginPage.actions.loginWithRecoveryCode(email, password, user.mfaRecoveryCodes[0]);
		mainSidebar.actions.signout();
	});

	it('Should be able to disable MFA in account', () => {
		const { email, password } = user;
		signinPage.actions.loginWithEmailAndPassword(email, password);
		personalSettingsPage.actions.enableMfa();
		mainSidebar.actions.signout();
		const token = generateOTPToken(user.mfaSecret);
		mfaLoginPage.actions.loginWithMfaToken(email, password, token);
		personalSettingsPage.actions.disableMfa();
		mainSidebar.actions.signout();
	});
});
