import React from 'react';
import { RocketIcon } from 'lucide-react';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import WebhookExample from '@/components/ui/WebhookExample';
import { useAuth } from '@/state/auth';
import { Integration, IntegrationMeta } from '@/types';
import { generateUuid } from '@/utils/uuid.util';

const NessusInstructions = () => {
  return (
    <div>
      <p className="mb-4">
        Chariot imports scan results from Nessus using the command line
        interface (CLI).
      </p>
      <h1 className="mb-2 text-xl font-bold">
        Install the CLI and configure it by:
      </h1>
      <pre className="mb-4 rounded-md bg-gray-100 p-4">
        <code>pip install praetorian-cli</code>
        <br />
        <code>praetorian configure</code>
      </pre>
      <h1 className="mb-2 mt-4 text-xl font-bold">
        Import Nessus results in one of two ways:
      </h1>
      <div className="">
        <h2 className="mb-2 mt-4 text-lg font-semibold">
          1. Connecting to a Nessus server:
        </h2>
        <pre className="mb-4 rounded-md bg-gray-100 p-4">
          <code>praetorian chariot script nessus-api</code>
        </pre>
        <h2 className="mb-2 mt-4 text-lg font-medium">
          2. Using an XML export file:
        </h2>
        <pre className="mb-4 rounded-md bg-gray-100 p-4">
          <code>praetorian chariot script nessus-xml</code>
        </pre>
      </div>
    </div>
  );
};

const AWSInstructions = () => {
  const { me, friend } = useAuth();
  const template =
    'https://s3.us-east-2.amazonaws.com/preview.chariot.praetorian.com/templates/aws-permissions-template.yaml';
  const url = `https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?templateURL=${template}&param_ExternalId=${friend || me}&stackName=Chariot`;
  return (
    <div>
      <p className="mb-4 block text-sm leading-6">
        Deploy the CloudFormation Stack into your management account, and then
        enter your management account ID and role name here.
      </p>
      <div>
        <Button
          styleType="primary"
          startIcon={<RocketIcon />}
          onClick={() => {
            window.open(url)?.focus();
          }}
          className="rounded-sm py-1"
          style={{
            padding: '0.5rem 0.5rem',
          }}
        >
          Launch CloudFormation Stack
        </Button>
      </div>
    </div>
  );
};

const defaultPin = generateUuid();
const uuid = generateUuid();

export const Integrations: Record<Integration, IntegrationMeta> = {
  kev: {
    id: Integration.kev,
    name: 'CISA KEV',
    description: '',
    logo: '/icons/kev.svg',
    inputs: [],
    markup: (
      <div className="text-default-light">
        <div>
          Known Exploited Vulnerabilities - The Cybersecurity & Infrastructure
          Security Agency (CISA) maintains the knowledge on cybersecurity risks
          that are being exploited in the real world.
        </div>
        <div className="mt-2">
          Each Known Exploited Risk (KEV), moves a cybersecurity vulnerability
          from theoretical to practical. Chariot shows you whether your
          organization is susceptible to KEVs so that you can focus attention on
          protecting against attacks that are being used now.
        </div>
      </div>
    ),
  },
  basAgent: {
    id: Integration.basAgent,
    name: 'Command & Control',
    description: 'Create an agent.',
    logo: '/icons/logo.png',
    inputs: [],
  },
  webhook: {
    id: Integration.webhook,
    name: 'ServiceNow',
    description: 'Push opened risks to ServiceNow.',
    logo: '/icons/ServiceNow.svg',
    inputs: [
      {
        name: 'username',
        value: Integration.webhook,
        hidden: true,
      },
      {
        name: 'value',
        value: 'servicenow',
        hidden: true,
      },
      {
        label: 'Scripted REST API',
        value: '',
        placeholder: 'https://webhook.com/services/',
        name: 'webhook',
        required: true,
        info: {
          text: 'The url to POST data to',
        },
      },
      {
        label: 'Basic Authentication Credentials',
        value: 'Authorization',
        placeholder: 'Content-Type: application/json',
        name: 'header',
        required: true,
        disabled: true,
        hidden: true,
      },
      {
        label: 'Basic Auth Token',
        value: '',
        placeholder: 'QmFzaWMgQXV0aCBUb2tlbgo=',
        name: 'token',
        required: true,
        info: {
          text: 'Optional, the value to populate `header` with',
        },
      },
      {
        label: 'Severity',
        value: 'MHC',
        name: 'severities',
        required: true,
        type: Input.Type.SELECT,
        options: [
          { label: 'Info', value: 'ILMHC' },
          { label: 'Low', value: 'LMHC' },
          { label: 'Medium', value: 'MHC' },
          { label: 'High', value: 'HC' },
          { label: 'Critical', value: 'C' },
        ],
        info: {
          text: 'Learn more',
          content: (
            <>
              <p>
                Select the minimum risk severity level that should send
                ServiceNow alerts.
              </p>
            </>
          ),
        },
      },
    ],
  },
  hook: {
    id: Integration.hook,
    name: 'Webhook',
    description: 'Push assets and risks to Chariot.',
    logo: '/icons/logo.png',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815155351835-Chariot-Webhooks',
      label: 'How to: Chariot Webhooks',
    },
    inputs: [
      {
        name: 'username',
        value: 'hook',
        hidden: true,
      },
      {
        label: 'Secret Pin',
        value: defaultPin,
        placeholder: uuid,
        name: 'pin',
        hidden: true,
      },
    ],
    markup: <WebhookExample defaultPin={defaultPin} />,
  },
  slack: {
    id: Integration.slack,
    name: 'Slack',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815125222171-Workplace-Messaging#slack',
      label: 'How to: Workplace Messaging - Slack',
    },
    description: 'Receive Slack notifications when new risks are discovered.',
    logo: '/icons/Slack.svg',
    inputs: [
      {
        name: 'username',
        value: 'slack',
        hidden: true,
      },
      {
        label: 'Webhook URL',
        value: '',
        placeholder: 'https://hooks.slack.com/services/',
        name: 'webhook',
        required: true,
        info: {
          url: 'https://api.slack.com/messaging/webhooks',
          text: 'Learn more',
        },
      },
      {
        label: 'Severity',
        value: 'MHC',
        name: 'severities',
        required: true,
        type: Input.Type.SELECT,
        options: [
          { label: 'Info', value: 'ILMHC' },
          { label: 'Low', value: 'LMHC' },
          { label: 'Medium', value: 'MHC' },
          { label: 'High', value: 'HC' },
          { label: 'Critical', value: 'C' },
        ],
        info: {
          text: 'Learn more',
          content: (
            <>
              <p>
                Select the minimum risk severity level that should send Slack
                alerts.
              </p>
            </>
          ),
        },
      },
    ],
  },
  phone: {
    id: Integration.phone,
    name: 'Phone Number',
    description: 'Receive SMS alerts when new risks are discovered.',
    logo: '/icons/IMessage_logo.svg',
    inputs: [
      {
        name: 'username',
        value: 'phone',
        hidden: true,
      },
      {
        label: 'Phone Number',
        value: '',
        placeholder: '+1 123-456-7890',
        name: 'number',
        required: true,
      },
    ],
  },
  email: {
    id: Integration.email,
    name: 'Email',
    description: 'Receive SMS alerts when new risks are discovered.',
    logo: '/icons/Mail.svg',
    inputs: [
      {
        name: 'username',
        value: 'email',
        hidden: true,
      },
      {
        label: 'Email Address',
        value: '',
        placeholder: 'example@companydomain.com',
        name: 'address',
        required: true,
      },
    ],
  },
  jira: {
    id: Integration.jira,
    name: 'Jira',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815095834267-Ticketing-Systems#jira',
      label: 'How to: Ticketing Systems - Jira',
    },
    description: 'Track and manage risks directly within your Jira project.',
    logo: '/icons/Jira.svg',
    inputs: [
      {
        name: 'username',
        value: 'jira',
        hidden: true,
      },
      {
        label: 'Base URL',
        value: '',
        placeholder: 'https://<your-domain>.atlassian.net',
        name: 'url',
        required: true,
      },
      {
        label: 'User Email',
        value: '',
        placeholder: 'username@yourdomain.com',
        name: 'userEmail',
        required: true,
      },
      {
        label: 'Access Token',
        value: '',
        placeholder:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuYXV0aDAuY29tLyIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tL2NhbGFuZGFyL3YxLyIsInN1YiI6InVzcl8xMjMiLCJpYXQiOjE0NTg3ODU3OTYsImV4cCI6MTQ1ODg3MjE5Nn0.CA7eaHjIHz5NxeIJoFK9krqaeZrPLwmMmgI_XiQiIkQ',
        name: 'accessToken',
        type: Input.Type.TEXT_AREA,
        password: true,
        required: true,
        info: {
          url: 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/',
          text: 'Learn more',
        },
      },
      {
        label: 'Project Key',
        value: '',
        placeholder: 'PROJ',
        name: 'projectKey',
        required: true,
        info: {
          text: 'Learn more',
          content: (
            <>
              <p>
                The project key is the letters prefix of your the issue key. For
                example, if your JIRA issues have keys like CHARIOT-6312 or
                CHARIOT-823, the project key is &quot;CHARIOT&quot;.
              </p>
            </>
          ),
        },
      },
      {
        label: 'Issue Type',
        value: '',
        placeholder: 'Task',
        name: 'issueType',
        required: true,
        info: {
          text: 'Learn more',
          content: (
            <>
              <p>
                Example issue types are Bug, Security Task, etc. Space in the
                issue type is allowed.
              </p>
            </>
          ),
        },
      },
      {
        label: 'Severity',
        value: 'MHC',
        name: 'severities',
        required: true,
        type: Input.Type.SELECT,
        options: [
          { label: 'Info', value: 'ILMHC' },
          { label: 'Low', value: 'LMHC' },
          { label: 'Medium', value: 'MHC' },
          { label: 'High', value: 'HC' },
          { label: 'Critical', value: 'C' },
        ],
        info: {
          text: 'Learn more',
          content: (
            <>
              <p>
                Select the minimum risk severity level that should create Jira
                tickets.
              </p>
            </>
          ),
        },
      },
    ],
  },
  github: {
    id: Integration.github,
    name: 'GitHub',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815083333787-Source-Code-Managers#github',
      label: 'How to: Source Code Managers - GitHub',
    },
    description: "Discover your GitHub organization's repositories and risks.",
    logo: '/icons/github-mark.svg',
    multiple: true,
    inputs: [
      {
        name: 'username',
        value: 'github',
        hidden: true,
      },
      {
        label: 'Personal Access Token (PAT)',
        value: '',
        placeholder: 'github_pat_123456abcdefg_123456abcdefg',
        name: 'pat',
        required: true,
        type: Input.Type.PASSWORD,
        info: {
          url: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
          text: 'Learn more',
        },
      },
      {
        label: 'GitHub Organization',
        value: '',
        placeholder: 'https://',
        pattern: '^http(s)?://.+$',
        name: 'value',
        required: true,
        info: {
          url: 'https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/about-organizations',
          text: 'Learn more',
        },
      },
    ],
  },
  amazon: {
    id: Integration.amazon,
    name: 'Amazon Web Services',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815119222811-Cloud-Providers#amazon',
      label: 'How to: Cloud Providers - Amazon',
    },
    description:
      'Discover and scan assets hosted within your AWS organization.',
    logo: '/icons/AWS.svg',
    multiple: true,
    inputs: [
      {
        name: 'username',
        value: 'amazon',
        hidden: true,
      },
      {
        label: 'Account ID',
        value: '',
        placeholder: '123456789012',
        name: 'value',
        required: true,
      },
      {
        label: 'Role Name',
        value: 'Chariot',
        placeholder: 'Chariot',
        name: 'role',
        required: true,
      },
    ],
    markup: <AWSInstructions />,
  },
  ns1: {
    id: Integration.ns1,
    name: 'NS1',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815092236443-Asset-Ingestion-Nessus-NS1-and-CrowdStrike#ns1',
      label: 'How to: Asset Ingestion - NS1',
    },
    description: 'Discover and scan assets managed within your NS1 tenant',
    logo: '/icons/NS1.svg',
    inputs: [
      {
        name: 'username',
        value: 'ns1',
        hidden: true,
      },
      {
        name: 'value',
        value: 'ns1',
        hidden: true,
      },
      {
        label: 'API Key',
        value: '',
        placeholder: 'examplejKg34KdVdfg61',
        name: 'ns1_api_key',
        required: true,
        type: Input.Type.PASSWORD,
        info: {
          url: 'https://www.ibm.com/docs/en/ns1-connect?topic=keys-create-api-key',
          text: 'Learn more',
        },
      },
    ],
  },
  gcp: {
    id: Integration.gcp,
    name: 'Google Cloud',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815119222811-Cloud-Providers#gcp',
      label: 'How to: Cloud Providers - Google Cloud',
    },
    description:
      'Discover and scan assets hosted within your GCP organization.',
    logo: '/icons/GoogleCloud.svg',
    multiple: true,
    inputs: [
      {
        name: 'username',
        value: 'gcp',
        hidden: true,
      },
      {
        label: 'Project ID',
        value: '',
        placeholder: 'praetorian-chariot-example',
        name: 'value',
        required: true,
      },
      {
        label: 'Service Account JSON Keyfile',
        value: '',
        placeholder:
          '{\n' +
          '  "type": "service_account",\n' +
          '  "project_id": "PROJECT_ID",\n' +
          '  "private_key_id": "KEY_ID",\n' +
          '  "private_key": "-----BEGIN PRIVATE KEY-----\\nPRIVATE_KEY\\n-----END PRIVATE KEY-----\\n",\n' +
          '  "client_email": "SERVICE_ACCOUNT_EMAIL",\n' +
          '  "client_id": "CLIENT_ID",\n' +
          '  "auth_uri": "https://accounts.google.com/o/oauth2/auth",\n' +
          '  "token_uri": "https://accounts.google.com/o/oauth2/token",\n' +
          '  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",\n' +
          '  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/SERVICE_ACCOUNT_EMAIL"\n' +
          '}',
        name: 'keyfile',
        required: true,
        type: Input.Type.TEXT_AREA,
      },
    ],
  },
  azure: {
    id: Integration.azure,
    name: 'Azure',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815119222811-Cloud-Providers#azure',
      label: 'How to: Cloud Providers - Azure',
    },
    description:
      'Discover and scan assets hosted within your Azure organization',
    logo: '/icons/Azure.svg',
    multiple: true,
    inputs: [
      {
        name: 'username',
        value: 'azure',
        hidden: true,
      },
      {
        label: 'Application ID',
        value: '',
        placeholder: uuid,
        name: 'name',
        required: true,
      },
      {
        label: 'Secret Value',
        value: '',
        placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        name: 'secret',
        required: true,
        type: Input.Type.PASSWORD,
      },
      {
        label: 'Tenant ID',
        value: '',
        placeholder: uuid,
        name: 'value',
        required: true,
      },
    ],
  },
  crowdstrike: {
    id: Integration.crowdstrike,
    name: 'CrowdStrike',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815092236443-Asset-Ingestion-Nessus-NS1-and-CrowdStrike#crowdstrike',
      label: 'How to: Asset Ingestion - CrowdStrike',
    },
    description:
      'Import your assets from CrowdStrike and identify policy risks',
    logo: '/icons/Crowdstrike.svg',
    inputs: [
      {
        name: 'username',
        value: 'crowdstrike',
        hidden: true,
      },
      {
        label: 'Client ID',
        value: '',
        placeholder: uuid,
        name: 'clientID',
        required: true,
      },
      {
        label: 'Secret',
        value: '',
        placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        name: 'secret',
        required: true,
        type: Input.Type.PASSWORD,
      },
      {
        label: 'Base URL',
        value: '',
        placeholder: 'https://example.praetorianlabs.api.crowdstrike.com',
        name: 'value',
        required: true,
      },
    ],
  },
  gitlab: {
    id: Integration.gitlab,
    name: 'GitLab',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815083333787-Source-Code-Managers#gitlab',
      label: 'How to: Source Code Managers - GitLab',
    },
    description: "Discover your GitLab organization's repositories and risks",
    logo: '/icons/GitLab.svg',
    multiple: true,
    inputs: [
      {
        name: 'username',
        value: 'gitlab',
        hidden: true,
      },
      {
        label: 'Personal Access Token (PAT)',
        value: '',
        placeholder: 'glpat-123456abcdefg-123456abcdefg',
        name: 'pat',
        required: true,
        type: Input.Type.PASSWORD,
        info: {
          url: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
          text: 'Learn more',
        },
      },
      {
        label: '(Parent) GitLab Group',
        value: '',
        placeholder: 'https://gitlab.com/gitlab-org',
        pattern: '^http(s)?://.+$',
        name: 'value',
        required: true,
        info: {
          url: 'https://docs.gitlab.com/ee/user/group/',
          text: 'Learn more',
        },
      },
    ],
  },
  nessus: {
    id: Integration.nessus,
    name: 'Nessus Tenable',
    description:
      'Industry-standard vulnerability scanner for comprehensive security assessments.',
    logo: '/icons/Nessus.svg',
    help: {
      href: 'https://docs.praetorian.com/hc/en-us/articles/25815092236443-Asset-Ingestion-Nessus-NS1-and-CrowdStrike#01J1TEBGSSDAA1KKXJQEATKJ22',
      label: 'How to: Asset Ingestion - Nessus',
    },
    markup: <NessusInstructions />,
  },
  zulip: {
    id: Integration.zulip,
    name: 'Zulip',
    description: 'Receive Zulip notifications when new risks are discovered.',
    logo: '/icons/Zulip.svg',
    inputs: [
      {
        name: 'username',
        value: 'zulip',
        hidden: true,
      },
      {
        label: 'Webhook URL',
        value: '',
        placeholder:
          'https://yourZulipDomain.zulipchat.com/api/v1/external/slack_incoming',
        name: 'webhook',
        required: true,
        info: {
          url: 'https://zulip.com/integrations/doc/slack_incoming',
          text: 'Learn more',
        },
      },
      {
        label: 'Severity',
        value: 'MHC',
        name: 'severities',
        required: true,
        type: Input.Type.SELECT,
        options: [
          { label: 'Info', value: 'ILMHC' },
          { label: 'Low', value: 'LMHC' },
          { label: 'Medium', value: 'MHC' },
          { label: 'High', value: 'HC' },
          { label: 'Critical', value: 'C' },
        ],
        info: {
          text: 'Learn more',
          content: (
            <>
              <p>
                Select the minimum risk severity level that should send Zulip
                alerts.
              </p>
            </>
          ),
        },
      },
    ],
  },
  teams: {
    id: Integration.teams,
    name: 'Microsoft Teams',
    description: 'Receive Teams notifications when new risks are discovered.',
    logo: '/icons/Teams.svg',
    inputs: [
      {
        name: 'username',
        value: 'teams',
        hidden: true,
      },
      {
        label: 'Webhook URL',
        value: '',
        placeholder: 'https://xxxxxxx.logic.azure.com:443/workflows/xxxxxxx',
        name: 'webhook',
        required: true,
        info: {
          url: 'https://support.microsoft.com/en-us/office/post-a-workflow-when-a-webhook-request-is-received-in-microsoft-teams-8ae491c7-0394-4861-ba59-055e33f75498',
          text: 'Learn more',
        },
      },
      {
        label: 'Severity',
        value: 'MHC',
        name: 'severities',
        required: true,
        type: Input.Type.SELECT,
        options: [
          { label: 'Info', value: 'ILMHC' },
          { label: 'Low', value: 'LMHC' },
          { label: 'Medium', value: 'MHC' },
          { label: 'High', value: 'HC' },
          { label: 'Critical', value: 'C' },
        ],
        info: {
          text: 'Learn more',
          content: (
            <>
              <p>
                Select the minimum risk severity level that should send Teams
                alerts.
              </p>
            </>
          ),
        },
      },
    ],
  },
  cloudflare: {
    id: Integration.cloudflare,
    name: 'Cloudflare DNS',
    description: 'Discover and scan assets managed within your Cloudflare DNS',
    logo: '/icons/Cloudflare.svg',
    inputs: [
      {
        name: 'username',
        value: 'cloudflare',
        hidden: true,
      },
      {
        name: 'value',
        value: 'cloudflare',
        hidden: true,
      },
      {
        label: 'API Token',
        value: '',
        placeholder: 'examplejKg34KdVdfg61',
        name: 'token',
        required: true,
        type: Input.Type.PASSWORD,
        info: {
          url: 'https://developers.cloudflare.com/fundamentals/api/get-started/create-token/',
          text: 'Learn more',
        },
      },
    ],
  },
  godaddy: {
    id: Integration.godaddy,
    logo: '/icons/GoDaddy.svg',
    name: 'GoDaddy',
  },
  gsuite: {
    id: Integration.gsuite,
    logo: '/icons/GoogleSuite.svg',
    name: 'Google Suite',
  },
  shodan: {
    id: Integration.shodan,
    logo: '/icons/shodan.png',
    name: 'Shodan',
  },
  securitytrails: {
    id: Integration.securitytrails,
    logo: '/icons/SecurityTrails.svg',
    name: 'SecurityTrails',
  },
  greynoise: {
    id: Integration.greynoise,
    logo: '/icons/greynoise_logo.jpeg',
    name: 'GreyNoise',
  },
  sentinel: {
    id: Integration.sentinel,
    logo: '/icons/Sentinel.jpg',
    name: 'Sentinel',
  },
  sumologic: {
    id: Integration.sumologic,
    logo: '/icons/SumoLogic.jpg',
    name: 'SumoLogic',
  },
  palo: {
    id: Integration.palo,
    logo: '/icons/PaloAlto.svg',
    name: 'PaloAlto Networks',
  },
  splunk: {
    id: Integration.splunk,
    logo: '/icons/Splunk.svg',
    name: 'Splunk',
  },
  graylog: {
    id: Integration.graylog,
    logo: '/icons/graylog.svg',
    name: 'Graylog',
  },
  tanium: {
    id: Integration.tanium,
    logo: '/icons/Tanium.png',
    name: 'Tanium',
  },
  orca: {
    id: Integration.orca,
    logo: '/icons/Orca.svg',
    name: 'Orca',
  },
  snyk: {
    id: Integration.snyk,
    logo: '/icons/Snyk.svg',
    name: 'Snyk',
  },
  ibmcloud: {
    id: Integration.ibmcloud,
    logo: '/icons/IBMCloud.svg',
    name: 'IBMCloud',
  },
  qualys: {
    id: Integration.qualys,
    logo: '/icons/Qualys.svg',
    name: 'Qualys',
  },
  mandiant: {
    id: Integration.mandiant,
    logo: '/icons/Mandiant.png',
    name: 'Mandiant',
  },
  nexpose: {
    id: Integration.nexpose,
    logo: '/icons/Nexpose.png',
    name: 'Nexpose',
  },
  jamf: {
    id: Integration.jamf,
    logo: '/icons/Jamf.png',
    name: 'Jamf',
  },
  r7: {
    id: Integration.r7,
    logo: '/icons/Rapid7.svg',
    name: 'Rapid7',
  },
  securityopscenter: {
    id: Integration.securityopscenter,
    logo: '/icons/ServiceNow.svg',
    name: 'SecOps',
  },
  jupiterone: {
    id: Integration.jupiterone,
    logo: '/icons/JupiterOne.svg',
    name: 'JupiterOne',
  },
  runzero: {
    id: Integration.runzero,
    logo: '/icons/RunZero.png',
    name: 'RunZero',
  },
  traceable: {
    id: Integration.traceable,
    logo: '/icons/Traceable.png',
    name: 'Traceable.ai',
  },
  trellix: {
    id: Integration.trellix,
    logo: '/icons/Trellix.svg',
    name: 'Trellix',
  },
  elasticsearch: {
    id: Integration.elasticsearch,
    logo: '/icons/ElasticSearch.svg',
    name: 'ElasticSearch',
  },
  defender: {
    id: Integration.defender,
    logo: '/icons/Defender.svg',
    name: 'Defender',
  },
  sentinelone: {
    id: Integration.sentinelone,
    logo: '/icons/SentinelOne.png',
    name: 'SentinelOne',
  },
  vulndb: {
    id: Integration.vulndb,
    logo: '/icons/vuldb.png',
    name: 'VulDB',
  },
  imperva: {
    id: Integration.imperva,
    logo: '/icons/Imperva.svg',
    name: 'Imperva',
  },
  f5: {
    id: Integration.f5,
    logo: '/icons/F5.svg',
    name: 'F5',
  },
  carbonblack: {
    id: Integration.carbonblack,
    logo: '/icons/CarbonBlack.svg',
    name: 'CarbonBlack',
  },
  devo: {
    id: Integration.devo,
    logo: '/icons/devo.png',
    name: 'Devo',
  },
  exabeam: {
    id: Integration.exabeam,
    logo: '/icons/exabeam.png',
    name: 'Exabeam',
  },
  newrelic: {
    id: Integration.newrelic,
    logo: '/icons/newrelic.jpeg',
    name: 'NewRelic',
  },
  dnsdb: {
    id: Integration.dnsdb,
    logo: '/icons/dnsdb.png',
    name: 'dnsdb',
  },
  akamai: {
    id: Integration.akamai,
    logo: '/icons/akamai.jpeg',
    name: 'Akamai',
  },
  datadog: {
    id: Integration.datadog,
    logo: '/icons/datadog.png',
    name: 'Datadog',
  },
  wiz: {
    id: Integration.wiz,
    logo: '/icons/wiz.png',
    name: 'Wiz',
  },
  digitalocean: {
    id: Integration.digitalocean,
    logo: '/icons/digitalocean.svg',
    name: 'DigitalOcean',
  },
};

export const availableAttackSurfaceIntegrations = [
  Integrations.amazon,
  Integrations.azure,
  Integrations.gcp,
  Integrations.ns1,
  Integrations.github,
  Integrations.gitlab,
  Integrations.crowdstrike,
  Integrations.nessus,
  Integrations.cloudflare,
];

export const availableAttackSurfaceIntegrationsKeys =
  availableAttackSurfaceIntegrations.map(
    integration => integration.id
  ) as string[];

// Begin "coming soon" integrations
export const comingSoonAttackSurfaceIntegrations = [
  Integrations.godaddy,
  Integrations.gsuite,
  Integrations.shodan,
  Integrations.securitytrails,
  Integrations.greynoise,
  Integrations.sentinel,
  Integrations.sumologic,
  Integrations.palo,
  Integrations.splunk,
  Integrations.graylog,
  Integrations.tanium,
  Integrations.orca,
  Integrations.snyk,
  Integrations.ibmcloud,
  Integrations.qualys,
  Integrations.mandiant,
  Integrations.r7,
  Integrations.securityopscenter,
  Integrations.jupiterone,
  Integrations.runzero,
  Integrations.traceable,
  Integrations.trellix,
  Integrations.elasticsearch,
  Integrations.defender,
  Integrations.sentinelone,
  Integrations.vulndb,
  Integrations.imperva,
  Integrations.f5,
  Integrations.carbonblack,
  Integrations.devo,
  Integrations.exabeam,
  Integrations.newrelic,
  Integrations.dnsdb,
  Integrations.akamai,
  Integrations.datadog,
  Integrations.wiz,
  Integrations.digitalocean,
  Integrations.email,
  Integrations.phone,
];

export const riskIntegrations = [
  Integrations.slack,
  Integrations.jira,
  Integrations.webhook,
  Integrations.zulip,
  Integrations.teams,
  Integrations.email,
  Integrations.phone,
];

export const riskIntegrationsKeys = riskIntegrations.map(
  integration => integration.id
) as string[];

export const allIntegrations = [
  ...availableAttackSurfaceIntegrations,
  ...comingSoonAttackSurfaceIntegrations,
  ...riskIntegrations,
];
