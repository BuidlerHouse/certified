"use client"

import { useEffect, useState } from "react"
import CreateCertification from "../Certifcation/createCertificationBar"
import DisplayCertificationTemplate from "../Certifcation/displayCertifcationTemplate"
import { createCertificationForUser, createCertificationType } from "@/lib/sign"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import DisplayCertification from "../Certifcation/displayCertifcation"
import IssuesCertification from "../Certifcation/IssueCertifcation"
import { AttestationRecordInput } from "@/app/api/func/issue-certificate/route"
import DynamicConnectButton from "../DynamicModal/walletWidget"
import { useUser } from "@/context/userContext"

type CertificationType = {
    certificationName: string
    note: string
    organizationName: string
}

export type CertificationContentType = {
    schemaId: string
    schema: CertificationType
    template: string
}

export default function Certification() {
    const [activeButton, setActiveButton] = useState<string>("OwnedCertifications")
    const [certificationName, setCertificationName] = useState<string>("")
    const [note, setNote] = useState<string>("")
    const [organizationName, setOrganizationName] = useState<string>("")
    const [alert, setAlert] = useState<"gen" | "issuing" | "issued sucess" | "sucess" | null>(null)
    const { primaryWallet } = useDynamicContext()
    const [ownedCertifications, setOwnedCertifications] = useState<
        CertificationContentType[] | null
    >(null)
    const { authorized } = useUser()
    const [selectedCertification, setSelectedCertification] =
        useState<CertificationContentType | null>(null)

    const handleGetCertifications = async () => {
        const userToken = localStorage.getItem("dynamic_authentication_token")
        if (!userToken) {
            return null
        }
        try {
            const response = await fetch("/api/func/fetch-template", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${JSON.parse(userToken)}`,
                },
            })
            const res = await response.json()
            setOwnedCertifications(res.schemas)
        } catch {}
    }

    const handleCreateCertification = async (template: string) => {
        const userToken = localStorage.getItem("dynamic_authentication_token")
        if (!userToken) {
            return null
        }

        if (!primaryWallet) return
        const schemaId = process.env.NEXT_SCHEMA_ID; // await createCertificationType(certificationName, primaryWallet)
        setAlert("gen")

        let data = {
            schemaId,
            schema: JSON.stringify({ certificationName, note, organizationName }),
            template,
        }

        const response = await fetch("/api/func/create-template", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${JSON.parse(userToken)}`,
            },
            body: JSON.stringify(data),
        })
        const res = await response.json()
        setAlert("sucess")
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setAlert(null)
        setActiveButton("OwnedCertifications")
    }

    const handleIssueCertification = async (
        schemaId: string,
        name: string,
        certifcationName: string,
        ceritifcationOrganization: string,
        IssuedToWallet: string,
        expirationDate: Date,
        email: string,
        handleGetCertificationRecord: (schemaId: string) => void
    ) => {
        const userToken = localStorage.getItem("dynamic_authentication_token")
        if (!userToken) {
            return null
        }
        if (!primaryWallet) return
        const attestationId = await createCertificationForUser(
            primaryWallet,
            name,
            note,
            certifcationName,
            ceritifcationOrganization,
            IssuedToWallet,
            expirationDate
        )

        setAlert("issuing")

        let data: AttestationRecordInput = {
            name,
            email,
            expirationAt: expirationDate,
            attestationId,
            walletAddress: IssuedToWallet,
            schemaId,
        }

        const response = await fetch("/api/func/issue-certificate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${JSON.parse(userToken)}`,
            },
            body: JSON.stringify(data),
        })
        const res = await response.json()
        setAlert("issued sucess")
        handleGetCertificationRecord(schemaId)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setAlert(null)
        setActiveButton("OwnedCertifications")
    }

    useEffect(() => {
        if (activeButton === "OwnedCertifications" && authorized) {
            handleGetCertifications()
        }
    }, [activeButton, authorized])
    return (
        <>
            <div className="toast toast-top toast-center z-50">
                {alert === "gen" && (
                    <div className="alert alert-info flex justify-center items-center">
                        <span>Creating, please wait...</span>
                        <span className="loading loading-infinity loading-lg"></span>
                    </div>
                )}
                {alert === "issuing" && (
                    <div className="alert alert-info flex justify-center items-center">
                        <span>Issuing certificate, please wait...</span>
                        <span className="loading loading-infinity loading-lg"></span>
                    </div>
                )}
                {alert === "issued sucess" && (
                    <div className="alert alert-success">
                        <span>Certification issued successfully.</span>
                    </div>
                )}
                {alert === "sucess" && (
                    <div className="alert alert-success">
                        <span>Certification created successfully.</span>
                    </div>
                )}
            </div>
            {!authorized ? (
                <div>
                    <DynamicConnectButton />
                </div>
            ) : (
                <div className="z-0 flex px-12 pt-[100px] pb-[100px] items-center justify-center gap-2 text-center min-h-full w-full overflow-auto">
                    {activeButton === "OwnedCertifications" ? (
                        <div className="w-full">
                            {ownedCertifications === null ? (
                                <span className="loading loading-infinity loading-lg"></span>
                            ) : (
                                <>
                                    {ownedCertifications.length === 0 ? (
                                        <div>
                                            <div className="flex justify-center">
                                                <img
                                                    src="/assets/landing_page_2.png"
                                                    alt="Certified"
                                                    className="w-64 h-64"
                                                />
                                            </div>
                                            <h1 className="text-lg font-bold">
                                                You don{"'"}t have any certification ready to be
                                                issued.
                                            </h1>
                                            <br />
                                            <button
                                                className="btn btn-neutral"
                                                onClick={() => {
                                                    setActiveButton("createNew")
                                                }}
                                            >
                                                Create a Certificate Template
                                            </button>
                                        </div>
                                    ) : selectedCertification !== null ? (
                                        <IssuesCertification
                                            selectedCertification={selectedCertification}
                                            setSelectedCertification={setSelectedCertification}
                                            handleIssueCertification={handleIssueCertification}
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-12 w-full justify-center items-center">
                                            {ownedCertifications.map((certification, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedCertification(certification)
                                                    }}
                                                >
                                                    <DisplayCertification
                                                        certificationName={
                                                            certification.schema.certificationName
                                                        }
                                                        note={certification.schema.note}
                                                        organizationName={
                                                            certification.schema.organizationName
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <main className="flex flex-col gap-4 w-full h-auto">
                            <div className="flex relative justify-center items-center">
                                <p className="text-lg font-semibold">
                                    Create Certificate Template
                                </p>
                            </div>
                            <div className="w-full h-auto flex gap-8">
                                <div className="w-3/4 h-full flex justify-center">
                                    <DisplayCertificationTemplate
                                        certificationName={certificationName}
                                        note={note}
                                        organizationName={organizationName}
                                    />
                                </div>
                                <CreateCertification
                                    certificationName={certificationName}
                                    setCertificationName={setCertificationName}
                                    note={note}
                                    setNote={setNote}
                                    organizationName={organizationName}
                                    setOrganizationName={setOrganizationName}
                                />
                            </div>
                            <div className="flex justify-center w-full mt-12">
                                <button
                                    disabled={!certificationName || !note || !organizationName}
                                    onClick={() => {
                                        handleCreateCertification("default")
                                    }}
                                    className="btn btn-active btn-xs sm:btn-sm md:btn-md lg:btn-lg w-[350px]"
                                >
                                    Create Certificate Template
                                </button>
                            </div>
                        </main>
                    )}
                    <div className="btm-nav">
                        <button
                            className={activeButton === "OwnedCertifications" ? "active" : ""}
                            onClick={() => setActiveButton("OwnedCertifications")}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                            </svg>
                            <span className="btm-nav-label">Issuing Certificate</span>
                        </button>
                        <button
                            className={activeButton === "createNew" ? "active" : ""}
                            onClick={() => setActiveButton("createNew")}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-badge-plus"
                            >
                                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                                <line x1="12" x2="12" y1="8" y2="16" />
                                <line x1="8" x2="16" y1="12" y2="12" />
                            </svg>
                            <span className="btm-nav-label">Create Certificate Template</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
