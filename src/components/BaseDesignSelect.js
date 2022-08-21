import React from "react";
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

export function BaseDesignSelect({baseDesign, setBaseDesign}) {
    return (
            <Form.Group as={Col} md="4" controlId="BaseDesignSelect">
                <Form.Label>Base Design</Form.Label>
                <Form.Control
                    required
                    as="select"
                    value={baseDesign}
                    onChange={e => {
                        setBaseDesign(e.target.value)}}
                >
                    <option value={""}>Choose...</option>
                    <option value={"Teddy-bear"}>Teddy-bear</option>
                    <option value={'Ro-Bear'}>Ro-Bear</option>
                    <option value={'Zom-Bear'}>Zom-Bear</option>
                    <option value={'Imposter - Alien'}>Imposter - Alien</option>
                    <option value={'Imposter - Pug'}>Imposter - Pug</option>
                    <option value={'Imposter - Waifu'}>Imposter - Waifu</option>
                    <option value={'Parody Character'}>Parody Character</option>
                    <option value={"Mutant"}>Mutant</option>
                </Form.Control>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            </Form.Group>
    );
}
  