import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import './App.css'
import { useRef } from 'react';

String.prototype.stripLeadingZeros = function() {
  return this.replace(/^0+/, '');
}

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
        type="text"
        placeholder="Drifter ID"
        onChange={onChange}
        defaultValue={drifterId} />
    </div>
  );
}

function DrifterPanel() {
  const { drifterId } = useParams();
  return (
    <div className="DrifterPanel">
      <DrifterSelector />
      <ShowDrifter drifterId={drifterId} />
    </div>
  )
}

function Home() {
  return (
    <div className="Home">
      <DrifterSelector />
      <p>The Fringe is a vast space, untouched by the rule of law. Full of danger. Full of opportunity. We are the DRIFTERS who roam these wild reaches.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <header>
        <h1>Fringe Drifters</h1>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/drifter/:drifterId" element={<DrifterPanel />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
