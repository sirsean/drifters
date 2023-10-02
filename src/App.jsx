import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal, Web3Button } from '@web3modal/react'
import { configureChains, createConfig, WagmiConfig, useAccount, useContractRead, useSignMessage } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { createPublicClient, http } from 'viem';
import DrifterABI from './assets/abi/DrifterABI';
import './App.css'
import { useRef } from 'react';
import DOMPurify from 'dompurify';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';

String.prototype.stripLeadingZeros = function() {
  return this.replace(/^0+/, '');
}

const chains = [mainnet];
const projectId = '47c8840a7b51934f322a7649ec932a7b';

const DRIFTER_ADDRESS = '0xe3B399AAb015D2C0D787ECAd40410D88f4f4cA50';

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)

class Drifter{
  constructor(id, metadata) {
    this.id = id;
    this.metadata = metadata;
  }

  get name() {
    return this.metadata.name;
  }

  get smallImageSrc() {
    return `/drifters/images/${this.id}.jpg`;
  }

  get fullImageSrc() {
    return this.metadata.image;
  }

  get attributes() {
    return this.metadata.attributes;
  }

  attribute(type) {
    return this.attributes.filter(({ trait_type }) => (trait_type == type))?.[0]?.value;
  }
}

function ShowDrifter({ drifterId }) {
  const [ drifter, setDrifter ] = useState(null);
  useEffect(() => {
    if (drifterId) {
      fetch(`/drifters/metadata/${drifterId}.json`)
        .then(r => r.json())
        .then(metadata => setDrifter(new Drifter(drifterId, metadata)))
        .catch(e => setDrifter(null));
    }
  }, [drifterId])
  if (drifterId && !drifter) {
    return (
      <div className="Drifter">
        <h3>Drifter #{drifterId} not found.</h3>
      </div>
    )
  } else if (drifter) {
    return (
      <div className="Drifter">
        <h3>{drifter.name}</h3>
        <div className="row">
          <a href={drifter.fullImageSrc} target="_blank">
            <img className="flex-1" src={drifter.smallImageSrc} />
          </a>
          <div className="flex-1 attrs">
            {drifter.attributes.map(({ trait_type, value }, index) => {
              return (
                <div key={index} className="attr">
                  {trait_type}
                  <span className="highlight">//</span>
                  {value}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

function DrifterSelector() {
  const { drifterId } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current.focus();
  }, []);
  const onChange = (e) => {
    e.preventDefault();
    const drifterId = e.target.value?.trim().stripLeadingZeros();
    if (drifterId && drifterId != '') {
      navigate(`/drifter/${drifterId}`);
    } else {
      navigate('/');
    }
  }
  return (
    <div className="DrifterSelector">
      <input ref={inputRef}
        type="number"
        placeholder="Drifter ID"
        onChange={onChange}
        defaultValue={drifterId} />
    </div>
  );
}

function workerPath(path) {
  if (__APP_ENV__ != 'dev') {
    return path;
  } else {
    const scheme = window.location.protocol;
    const hostname = window.location.hostname;
    const port = 8788;
    return `${scheme}//${hostname}:${port}${path}`;
  }
}

async function getSHA256Hash(str) {
  const textBuffer = new TextEncoder().encode(str); // Convert string to ArrayBuffer
  const hashBuffer = await crypto.subtle.digest('SHA-256', textBuffer); // Get hash
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert to byte array
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // Convert to hex
}

function Markdown({ content }) {
  if (content) {
    const html = DOMPurify.sanitize(content);
    return <ReactMarkdown>{html}</ReactMarkdown>;
  }
}

function DrifterNarrative() {
  const { drifterId } = useParams();
  const { address } = useAccount();
  const [ narrative, setNarrative ] = useState(null);
  const [ isOwner, setIsOwner ] = useState(false);
  const [ isEditing, setIsEditing ] = useState(false);
  const [ messageToSign, setMessageToSign ] = useState(null);
  const [ signature, setSignature ] = useState(null);
  const formRef = useRef(null);
  useEffect(() => {
    if (drifterId) {
      fetch(workerPath(`/api/narrative/${drifterId}`))
        .then(r => r.json())
        .then(n => setNarrative(n))
        .catch(e => {
          console.error(e);
          setNarrative(null)
        });
    } else {
      setNarrative(null);
    }
  }, [drifterId]);
  useContractRead({
    address: DRIFTER_ADDRESS,
    abi: DrifterABI,
    functionName: 'ownerOf',
    args: [drifterId],
    onSuccess(data) {
      setIsOwner(address == data);
    },
    onError(err) {
      setIsOwner(false);
    },
  }, [drifterId, address]);
  const { signMessage } = useSignMessage({
    message: messageToSign,
    onSuccess(data) {
      setSignature(data);
    },
    onError(_) {
      setSignature(null);
    },
  });
  const onStartEdit = (e) => {
    e.preventDefault();
    setMessageToSign(null);
    setSignature(null);
    setIsEditing(true);
  }
  const onStopEditing = (e) => {
    e.preventDefault();
    setMessageToSign(null);
    setSignature(null);
    setIsEditing(false);
  }
  const onNarrativeChange = async (e) => {
    const newNarrative = formRef.current.children.narrative.value;
    const hash = await getSHA256Hash(newNarrative);
    const message = `I own Drifter ${drifterId} and I am posting ${hash}`;
    setMessageToSign(message);
  }
  const onSign = (e) => {
    e.preventDefault();
    signMessage();
  }
  const onSave = (e) => {
    e.preventDefault();
    fetch(workerPath(`/api/narrative/${drifterId}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drifterId,
        narrative: formRef.current.children.narrative.value,
        signedMessage: messageToSign,
        signature: signature,
      }),
    }).then(r => r.json())
      .then(n => setNarrative(n))
      .then(_ => setMessageToSign(null))
      .then(_ => setSignature(null))
      .then(_ => setIsEditing(false))
      .catch(e => {
        console.error(e);
      })
  }
  if (narrative && !isOwner) {
    return (
      <div className="DrifterNarrative">
        <Markdown content={narrative.narrative} />
      </div>
    )
  } else if (isOwner && isEditing) {
    return (
      <div className="DrifterNarrative">
        <form ref={formRef}>
          <textarea
            name="narrative"
            rows="12"
            onChange={onNarrativeChange}
            defaultValue={narrative?.narrative || ''} />
          <div className="actions">
            <a href="#" onClick={onStopEditing}>Cancel</a>
            <button disabled={!messageToSign || !!signature} onClick={onSign}>Sign</button>
            <button disabled={!signature} onClick={onSave}>Save</button>
          </div>
          <p className="disclaimer">You will sign a message including your Drifter's ID and a hash of the narrative you've entered. This will prove you own the drifter, and thus have the right to save the narrative. This is free and gasless, and provides no other access to your wallet or its contents.</p>
          <p className="disclaimer">Oh, and this is Markdown. So you can add some formatting and links and such.</p>
        </form>
      </div>
    )
  } else if (narrative && isOwner) {
    return (
      <div className="DrifterNarrative">
        <Markdown content={narrative.narrative} />
        <hr className="divider" />
        <p>As the owner, you can <a href="#" onClick={onStartEdit}>edit</a> this.</p>
      </div>
    )
  } else if (!narrative && isOwner) {
    return (
      <div className="DrifterNarrative">
        <p>As the owner of this Drifter, you can <a href="#" onClick={onStartEdit}>write</a> their story.</p>
      </div>
    )
  }
}

function DrifterPanel() {
  const { drifterId } = useParams();
  return (
    <div className="DrifterPanel">
      <DrifterSelector />
      {drifterId && (
        <>
          <ShowDrifter drifterId={drifterId} />
          <DrifterNarrative drifterId={drifterId} />
        </>
      )}
    </div>
  );
}

function Home() {
  const [narratives, setNarratives] = useState(null);

  useEffect(() => {
    fetch(workerPath('/api/narrative'))
      .then(response => response.json())
      .then(coll => setNarratives(coll))
      .catch(error => console.error('Error fetching narratives:', error));
  }, []);

  return (
    <div className="Home">
      <DrifterSelector />
      <p>
        The Fringe is a vast space, untouched by the rule of law. Full of
        danger. Full of opportunity. We are the DRIFTERS who roam these wild
        reaches.
      </p>
      {narratives && (
        <>
          <p>Explore these drifters and their stories!</p>
          <ul>
            {narratives.map(({ drifterId }) => {
              const drifterUrl = `/drifter/${drifterId}`;
              return (
                <li key={drifterId}>
                  <Link to={drifterUrl}>{drifterId}</Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <BrowserRouter>
          <header>
            <div className="flex-1">
              <h1><Link to="/">Fringe Drifters</Link></h1>
            </div>
            <div className="auth">
              <Web3Button />
            </div>
          </header>
          <hr className="divider" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/drifter/:drifterId" element={<DrifterPanel />} />
          </Routes>
        </BrowserRouter>
      </WagmiConfig>
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </>
  )
}

export default App
